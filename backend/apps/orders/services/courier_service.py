from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.orders.models import Order, PaymentMethod
from common.notifications import notify


def format_order_number(order_id: int) -> str:
    return f"VENI-{int(order_id):05d}"


def build_courier_slip(order: Order) -> dict:
    """Courier-ready consignment fields derived from a frozen Order.

    Admins copy these into TCS / Leopards / CallCourier (etc.) booking screens.
    COD amount is the Order total only when payment_method is cash on delivery.
    """
    items = list(order.items.all())
    pieces = sum(item.quantity for item in items)
    names = [item.product_name_snapshot for item in items]
    description = ", ".join(names[:5])
    if len(names) > 5:
        description += f" (+{len(names) - 5} more)"

    is_cod = order.payment_method == PaymentMethod.CASH_ON_DELIVERY
    return {
        "order_number": format_order_number(order.id),
        "consignee_name": order.contact_name,
        "consignee_phone": order.contact_phone,
        "consignee_email": order.contact_email,
        "consignee_address": order.shipping_address,
        "consignee_city": order.shipping_city,
        "pieces": pieces,
        "payment_mode": "COD" if is_cod else "Prepaid",
        "cod_amount": order.total if is_cod else Decimal("0.00"),
        "product_description": description or "Veni order",
        "order_total": order.total,
        "courier_name": order.courier_name,
        "tracking_number": order.courier_tracking_number,
        "notes": order.courier_notes,
    }


@transaction.atomic
def update_courier_details(
    *,
    order_id: int,
    courier_name: str,
    tracking_number: str,
    notes: str = "",
) -> Order:
    order = get_object_or_404(Order.objects.select_for_update(), pk=order_id)
    previous_tracking = order.courier_tracking_number
    order.courier_name = courier_name.strip()
    order.courier_tracking_number = tracking_number.strip()
    order.courier_notes = notes.strip()
    order.save(
        update_fields=[
            "courier_name",
            "courier_tracking_number",
            "courier_notes",
            "updated_at",
        ]
    )
    if order.courier_tracking_number and order.courier_tracking_number != previous_tracking:
        notify(
            "tracking_updated",
            email=order.contact_email,
            context={"order_id": order.id},
        )
    return order
