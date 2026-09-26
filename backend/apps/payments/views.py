from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.serializers import (
    AdminProofUrlSerializer,
    ConfirmPaymentSerializer,
    ManualPaymentInstructionsSerializer,
    PaymentRecordSerializer,
    PresignPaymentSerializer,
    RejectPaymentSerializer,
)
from apps.payments.services import payment_service
from common.authentication import SessionAuthenticationWithCsrf
from common.permissions import IsAdmin, IsCustomer


def _validation_error(exc: DjangoValidationError) -> None:
    if hasattr(exc, "message_dict"):
        raise ValidationError(exc.message_dict) from exc
    messages = getattr(exc, "messages", None)
    if messages:
        raise ValidationError({"detail": messages[0]}) from exc
    raise ValidationError({"detail": str(exc)}) from exc


class ManualPaymentInstructionsView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(responses={200: ManualPaymentInstructionsSerializer})
    def get(self, request):
        return Response(payment_service.get_manual_payment_instructions())


class PaymentPresignView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(request=PresignPaymentSerializer)
    def post(self, request):
        serializer = PresignPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            presigned = payment_service.request_proof_presign(
                request.user,
                order_id=data["order_id"],
                content_type=data["file_type"],
                byte_size=data["byte_size"],
            )
        except DjangoValidationError as exc:
            _validation_error(exc)
        return Response(
            {
                "upload_url": presigned.url,
                "fields": presigned.fields,
                "s3_key": presigned.s3_key,
                "expires_in": presigned.expires_in,
            }
        )


class PaymentConfirmView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(
        request=ConfirmPaymentSerializer,
        responses={200: PaymentRecordSerializer},
    )
    def post(self, request):
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            payment = payment_service.confirm_proof_upload(
                request.user,
                order_id=data["order_id"],
                s3_key=data["s3_key"],
                reference_number=data.get("reference_number") or "",
            )
        except DjangoValidationError as exc:
            _validation_error(exc)
        return Response(PaymentRecordSerializer(payment).data)


class AdminPaymentVerifyView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(responses={200: PaymentRecordSerializer})
    def post(self, request, pk: int):
        try:
            payment = payment_service.verify_payment(request.user, payment_id=pk)
        except DjangoValidationError as exc:
            _validation_error(exc)
        return Response(PaymentRecordSerializer(payment).data)


class AdminPaymentRejectView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        request=RejectPaymentSerializer,
        responses={200: PaymentRecordSerializer},
    )
    def post(self, request, pk: int):
        serializer = RejectPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payment = payment_service.reject_payment(
                request.user,
                payment_id=pk,
                reason=serializer.validated_data["reason"],
            )
        except DjangoValidationError as exc:
            _validation_error(exc)
        return Response(PaymentRecordSerializer(payment).data)


class AdminPaymentProofView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(responses={200: AdminProofUrlSerializer})
    def get(self, request, pk: int):
        try:
            payload = payment_service.admin_proof_read_url(payment_id=pk)
        except DjangoValidationError as exc:
            _validation_error(exc)
        return Response(payload)
