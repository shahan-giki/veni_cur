from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.accounts.models import User
from apps.orders.models import Order, OrderStatus
from apps.payments.models import Payment, PaymentStatus
from apps.payments.services.payment_proof_storage import get_payment_proof_storage


def get_manual_payment_instructions() -> dict:
    return {
        "currency": "PKR",
        "bank_name": getattr(settings, "VENI_PAYMENT_BANK_NAME", "Habib Bank Limited"),
        "account_title": getattr(
            settings, "VENI_PAYMENT_ACCOUNT_TITLE", "Veni (Pvt) Ltd"
        ),
        "account_number": getattr(
            settings, "VENI_PAYMENT_ACCOUNT_NUMBER", "01234567890123"
        ),
        "iban": getattr(settings, "VENI_PAYMENT_IBAN", "PK00HABB0000123456789012"),
        "instructions": getattr(
            settings,
            "VENI_MANUAL_PAYMENT_INSTRUCTIONS",
            (
                "Transfer the exact order total via bank transfer or mobile wallet "
                "(Easypaisa/JazzCash). Use your order number as the payment reference."
            ),
        ),
    }


def _get_customer_order(user: User, order_id: int) -> Order:
    return get_object_or_404(Order, pk=order_id, customer=user)


def _assert_order_allows_upload(order: Order) -> None:
    if order.status != OrderStatus.PENDING_PAYMENT:
        raise ValidationError({"detail": "This order is not awaiting payment proof."})
    if Payment.objects.filter(
        order=order,
        status__in=(PaymentStatus.PENDING, PaymentStatus.VERIFIED),
    ).exists():
        raise ValidationError(
            {"detail": "A payment is already pending review or verified."}
        )


def request_proof_presign(
    user: User,
    *,
    order_id: int,
    content_type: str,
    byte_size: int,
):
    order = _get_customer_order(user, order_id)
    _assert_order_allows_upload(order)
    storage = get_payment_proof_storage()
    return storage.create_presigned_upload(
        order_id=order.id,
        content_type=content_type,
        byte_size=byte_size,
    )


@transaction.atomic
def confirm_proof_upload(
    user: User,
    *,
    order_id: int,
    s3_key: str,
    reference_number: str = "",
) -> Payment:
    order = _get_customer_order(user, order_id)
    _assert_order_allows_upload(order)
    prefix = f"payments/orders/{order.id}/"
    if not s3_key.startswith(prefix):
        raise ValidationError({"s3_key": "Invalid proof key for this order."})
    storage = get_payment_proof_storage()
    if not storage.object_exists(s3_key=s3_key):
        raise ValidationError({"s3_key": "Upload was not found. Please try again."})

    payment = Payment.objects.create(
        order=order,
        amount=order.total,
        reference_number=(reference_number or "").strip(),
        proof_s3_key=s3_key,
        status=PaymentStatus.PENDING,
    )
    order.status = OrderStatus.PAYMENT_VERIFICATION
    order.save(update_fields=["status", "updated_at"])
    return payment


def latest_payment_for_order(order: Order) -> Payment | None:
    return order.payments.order_by("-created_at").first()


def customer_payment_state(order: Order) -> dict:
    latest = latest_payment_for_order(order)
    has_active = Payment.objects.filter(
        order=order,
        status__in=(PaymentStatus.PENDING, PaymentStatus.VERIFIED),
    ).exists()
    can_upload = order.status == OrderStatus.PENDING_PAYMENT and not has_active
    return {
        "can_upload_proof": can_upload,
        "status": latest.status if latest else None,
        "rejection_reason": (
            latest.rejection_reason
            if latest and latest.status == PaymentStatus.REJECTED
            else ""
        ),
        "reference_number": latest.reference_number if latest else "",
        "updated_at": latest.updated_at if latest else None,
    }


@transaction.atomic
def verify_payment(_admin: User, *, payment_id: int) -> Payment:
    payment = get_object_or_404(
        Payment.objects.select_for_update().select_related("order"),
        pk=payment_id,
    )
    if payment.status != PaymentStatus.PENDING:
        raise ValidationError({"detail": "Only pending payments can be verified."})
    payment.status = PaymentStatus.VERIFIED
    payment.save(update_fields=["status", "updated_at"])
    order = payment.order
    order.status = OrderStatus.PROCESSING
    order.save(update_fields=["status", "updated_at"])
    return payment


@transaction.atomic
def reject_payment(_admin: User, *, payment_id: int, reason: str) -> Payment:
    payment = get_object_or_404(
        Payment.objects.select_for_update().select_related("order"),
        pk=payment_id,
    )
    if payment.status != PaymentStatus.PENDING:
        raise ValidationError({"detail": "Only pending payments can be rejected."})
    cleaned = (reason or "").strip()
    if not cleaned:
        raise ValidationError({"reason": "Rejection reason is required."})
    payment.status = PaymentStatus.REJECTED
    payment.rejection_reason = cleaned
    payment.save(update_fields=["status", "rejection_reason", "updated_at"])
    order = payment.order
    order.status = OrderStatus.PENDING_PAYMENT
    order.save(update_fields=["status", "updated_at"])
    return payment


def admin_proof_read_url(*, payment_id: int) -> dict:
    payment = get_object_or_404(Payment, pk=payment_id)
    if not payment.proof_s3_key:
        raise ValidationError({"detail": "No proof uploaded for this payment."})
    storage = get_payment_proof_storage()
    presigned = storage.create_presigned_read(s3_key=payment.proof_s3_key)
    return {"url": presigned.url, "expires_in": presigned.expires_in}
