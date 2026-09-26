import mimetypes
import uuid
from dataclasses import dataclass
from typing import Protocol

from django.conf import settings
from django.core.exceptions import ValidationError

ALLOWED_PRODUCT_IMAGE_CONTENT_TYPES = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }
)

ALLOWED_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".webp", ".gif"})


@dataclass
class PresignedUpload:
    url: str
    fields: dict
    s3_key: str
    expires_in: int


@dataclass
class PresignedRead:
    url: str
    expires_in: int


class ProductImageStorage(Protocol):
    def build_product_image_key(self, product_id: int, content_type: str) -> str: ...

    def create_presigned_upload(
        self, *, product_id: int, content_type: str, byte_size: int
    ) -> PresignedUpload: ...

    def create_presigned_read(self, *, s3_key: str) -> PresignedRead: ...

    def delete_object(self, *, s3_key: str) -> None: ...


def validate_product_image_upload(*, content_type: str, byte_size: int) -> None:
    max_bytes = getattr(settings, "PRODUCT_IMAGE_MAX_BYTES", 5 * 1024 * 1024)
    if byte_size <= 0:
        raise ValidationError({"byte_size": "File size must be positive."})
    if byte_size > max_bytes:
        raise ValidationError(
            {"byte_size": f"File exceeds maximum size of {max_bytes} bytes."}
        )
    normalized = content_type.split(";")[0].strip().lower()
    if normalized not in ALLOWED_PRODUCT_IMAGE_CONTENT_TYPES:
        raise ValidationError({"content_type": "Unsupported image type."})


def extension_for_content_type(content_type: str) -> str:
    normalized = content_type.split(";")[0].strip().lower()
    ext = mimetypes.guess_extension(normalized) or ".bin"
    if ext == ".jpe":
        ext = ".jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError({"content_type": "Unsupported image type."})
    return ext


class Boto3ProductImageStorage:
    """Private S3 presigned upload/read (ADR-0005)."""

    def __init__(self) -> None:
        import boto3

        self._bucket = settings.AWS_S3_BUCKET_NAME
        if not self._bucket:
            raise ValidationError("AWS_S3_BUCKET_NAME is not configured.")
        self._client = boto3.client("s3", region_name=settings.AWS_REGION)
        self._upload_expiry = getattr(settings, "S3_PRESIGN_UPLOAD_EXPIRY", 3600)
        self._read_expiry = getattr(settings, "S3_PRESIGN_READ_EXPIRY", 900)

    def build_product_image_key(self, product_id: int, content_type: str) -> str:
        ext = extension_for_content_type(content_type)
        return f"products/{product_id}/{uuid.uuid4().hex}{ext}"

    def create_presigned_upload(
        self, *, product_id: int, content_type: str, byte_size: int
    ) -> PresignedUpload:
        validate_product_image_upload(content_type=content_type, byte_size=byte_size)
        s3_key = self.build_product_image_key(product_id, content_type)
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

    def create_presigned_read(self, *, s3_key: str) -> PresignedRead:
        url = self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": s3_key},
            ExpiresIn=self._read_expiry,
        )
        return PresignedRead(url=url, expires_in=self._read_expiry)

    def delete_object(self, *, s3_key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=s3_key)


class InMemoryProductImageStorage:
    """Test double — no real AWS calls."""

    def __init__(self) -> None:
        self.objects: dict[str, dict] = {}
        self.deleted: list[str] = []

    def build_product_image_key(self, product_id: int, content_type: str) -> str:
        ext = extension_for_content_type(content_type)
        return f"products/{product_id}/{uuid.uuid4().hex}{ext}"

    def create_presigned_upload(
        self, *, product_id: int, content_type: str, byte_size: int
    ) -> PresignedUpload:
        validate_product_image_upload(content_type=content_type, byte_size=byte_size)
        s3_key = self.build_product_image_key(product_id, content_type)
        self.objects[s3_key] = {"product_id": product_id, "content_type": content_type}
        return PresignedUpload(
            url="https://fake-s3.test/upload",
            fields={"key": s3_key},
            s3_key=s3_key,
            expires_in=3600,
        )

    def create_presigned_read(self, *, s3_key: str) -> PresignedRead:
        return PresignedRead(url=f"https://fake-s3.test/read/{s3_key}", expires_in=900)

    def delete_object(self, *, s3_key: str) -> None:
        self.deleted.append(s3_key)
        self.objects.pop(s3_key, None)


def get_product_image_storage() -> ProductImageStorage:
    backend = getattr(settings, "PRODUCT_IMAGE_STORAGE_BACKEND", "boto3")
    if backend == "memory":
        return InMemoryProductImageStorage()
    return Boto3ProductImageStorage()
