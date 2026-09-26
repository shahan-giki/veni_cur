from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.orders.models import Order, OrderStatus
from apps.payments.models import Payment, PaymentStatus

ADMIN_SETTABLE_STATUSES = frozenset(
    {OrderStatus.SHIPPED, OrderStatus.CANCELLED}
)


def update_order_status(*, order_id: int, new_status: str) -> Order:
    if new_status not in ADMIN_SETTABLE_STATUSES:
        raise ValidationError(
            {
                "status": (
                    "Admins may only set SHIPPED or CANCELLED via this endpoint. "
                    "Payment states are updated through payment verification."
                )
            }
        )

    with transaction.atomic():
        order = get_object_or_404(Order.objects.select_for_update(), pk=order_id)
        current = order.status

        if new_status == OrderStatus.SHIPPED:
            if current != OrderStatus.PROCESSING:
                raise ValidationError(
                    {"status": "Only processing orders can be marked shipped."}
                )
        elif new_status == OrderStatus.CANCELLED:
            if current in (OrderStatus.SHIPPED, OrderStatus.CANCELLED):
                raise ValidationError(
                    {"status": "This order cannot be cancelled."}
                )
            if current == OrderStatus.PAYMENT_VERIFICATION:
                if Payment.objects.filter(
                    order=order, status=PaymentStatus.PENDING
                ).exists():
                    raise ValidationError(
                        {
                            "status": (
                                "Reject or verify the pending payment before "
                                "cancelling this order."
                            )
                        }
                    )

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
        return order
