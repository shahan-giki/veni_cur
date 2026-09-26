import mimetypes
import uuid
from typing import Protocol

from django.conf import settings
from django.core.exceptions import ValidationError

from apps.catalog.services.s3_storage import PresignedRead, PresignedUpload

ALLOWED_PAYMENT_PROOF_CONTENT_TYPES = frozenset(
    {
        "image/jpeg",
        "image/png",
        "application/pdf",
    }
)

ALLOWED_PAYMENT_PROOF_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".pdf"})


class PaymentProofStorage(Protocol):
    def build_proof_key(self, order_id: int, content_type: str) -> str: ...

    def create_presigned_upload(
        self, *, order_id: int, content_type: str, byte_size: int
    ) -> PresignedUpload: ...

    def object_exists(self, *, s3_key: str) -> bool: ...

    def create_presigned_read(self, *, s3_key: str) -> PresignedRead: ...


def extension_for_payment_proof(content_type: str) -> str:
    normalized = content_type.split(";")[0].strip().lower()
    ext = mimetypes.guess_extension(normalized) or ".bin"
    if ext == ".jpe":
        ext = ".jpg"
    if normalized == "application/pdf":
        ext = ".pdf"
    if ext not in ALLOWED_PAYMENT_PROOF_EXTENSIONS:
        raise ValidationError({"file_type": "Unsupported file type."})
    return ext


def validate_payment_proof_upload(*, content_type: str, byte_size: int) -> None:
    max_bytes = getattr(
        settings, "PAYMENT_PROOF_MAX_BYTES", 5 * 1024 * 1024
    )
    if byte_size <= 0:
        raise ValidationError({"byte_size": "File size must be positive."})
    if byte_size > max_bytes:
        raise ValidationError(
            {"byte_size": f"File exceeds maximum size of {max_bytes} bytes."}
        )
    normalized = content_type.split(";")[0].strip().lower()
    if normalized not in ALLOWED_PAYMENT_PROOF_CONTENT_TYPES:
        raise ValidationError({"file_type": "Unsupported file type."})


class Boto3PaymentProofStorage:
    def __init__(self) -> None:
        import boto3

        self._bucket = settings.AWS_S3_BUCKET_NAME
        if not self._bucket:
            raise ValidationError("AWS_S3_BUCKET_NAME is not configured.")
        self._client = boto3.client("s3", region_name=settings.AWS_REGION)
        self._upload_expiry = getattr(settings, "S3_PRESIGN_UPLOAD_EXPIRY", 3600)
        self._read_expiry = getattr(settings, "S3_PRESIGN_READ_EXPIRY", 900)

    def build_proof_key(self, order_id: int, content_type: str) -> str:
        ext = extension_for_payment_proof(content_type)
        return f"payments/orders/{order_id}/{uuid.uuid4().hex}{ext}"

    def create_presigned_upload(
        self, *, order_id: int, content_type: str, byte_size: int
    ) -> PresignedUpload:
        validate_payment_proof_upload(content_type=content_type, byte_size=byte_size)
        s3_key = self.build_proof_key(order_id, content_type)
        normalized = content_type.split(";")[0].strip().lower()
        conditions = [
            {"bucket": self._bucket},
            {"key": s3_key},
            {"Content-Type": normalized},
            ["content-length-range", 1, byte_size],
        ]
        post = self._client.generate_presigned_post(
            Bucket=self._bucket,
            Key=s3_key,
            Fields={"Content-Type": normalized},
            Conditions=conditions,
            ExpiresIn=self._upload_expiry,
        )
        return PresignedUpload(
            url=post["url"],
            fields=post["fields"],
            s3_key=s3_key,
            expires_in=self._upload_expiry,
        )

    def object_exists(self, *, s3_key: str) -> bool:
        from botocore.exceptions import ClientError

        try:
            self._client.head_object(Bucket=self._bucket, Key=s3_key)
            return True
        except ClientError:
            return False

    def create_presigned_read(self, *, s3_key: str) -> PresignedRead:
        url = self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": s3_key},
            ExpiresIn=self._read_expiry,
        )
        return PresignedRead(url=url, expires_in=self._read_expiry)


class InMemoryPaymentProofStorage:
    def __init__(self) -> None:
        self.objects: dict[str, dict] = {}

    def build_proof_key(self, order_id: int, content_type: str) -> str:
        ext = extension_for_payment_proof(content_type)
        return f"payments/orders/{order_id}/{uuid.uuid4().hex}{ext}"

    def create_presigned_upload(
        self, *, order_id: int, content_type: str, byte_size: int
    ) -> PresignedUpload:
        validate_payment_proof_upload(content_type=content_type, byte_size=byte_size)
        s3_key = self.build_proof_key(order_id, content_type)
        self.objects[s3_key] = {"order_id": order_id, "content_type": content_type}
        return PresignedUpload(
            url="https://fake-s3.test/payment-upload",
            fields={"key": s3_key},
            s3_key=s3_key,
            expires_in=3600,
        )

    def object_exists(self, *, s3_key: str) -> bool:
        return s3_key in self.objects

    def create_presigned_read(self, *, s3_key: str) -> PresignedRead:
        return PresignedRead(
            url=f"https://fake-s3.test/read/{s3_key}",
            expires_in=900,
        )


_MEMORY_PAYMENT_PROOF_STORAGE = InMemoryPaymentProofStorage()


def get_payment_proof_storage() -> PaymentProofStorage:
    backend = getattr(settings, "PAYMENT_PROOF_STORAGE_BACKEND", "memory")
    if backend == "memory":
        return _MEMORY_PAYMENT_PROOF_STORAGE
    return Boto3PaymentProofStorage()
