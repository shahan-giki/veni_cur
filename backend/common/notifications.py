"""Thin transactional notification seam — console/SMTP adapters, no microservice."""

from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger("veni.notifications")

ORDER_EVENTS = frozenset(
    {
        "order_created",
        "payment_proof_uploaded",
        "payment_verified",
        "payment_rejected",
        "order_shipped",
        "tracking_updated",
    }
)

SUBJECTS = {
    "order_created": "Your Veni order confirmation",
    "payment_proof_uploaded": "We received your Veni payment proof",
    "payment_verified": "Your Veni payment was verified",
    "payment_rejected": "Your Veni payment needs attention",
    "order_shipped": "Your Veni order has shipped",
    "tracking_updated": "Tracking update for your Veni order",
    "password_reset": "Reset your Veni password",
}


def notify(event: str, *, email: str, context: dict[str, Any] | None = None) -> None:
    """Send a transactional notification. Failures are logged, not raised."""
    if not email:
        return
    context = dict(context or {})
    if event in ORDER_EVENTS and context.get("order_id") is not None:
        context = {**_load_order_context(int(context["order_id"])), **context}

    subject = SUBJECTS.get(event, f"Veni: {event}")
    if context.get("order_number"):
        subject = f"{subject} ({context['order_number']})"

    text_body = _render_text(event, context)
    html_body = _render_html(event, context) if event in ORDER_EVENTS else None

    try:
        if getattr(settings, "EMAIL_BACKEND", "").endswith("console.EmailBackend") or getattr(
            settings, "VENI_NOTIFICATIONS_CONSOLE", True
        ):
            logger.info("notify event=%s to=%s subject=%s", event, email, subject)

        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@veni.store"),
            to=[email],
        )
        if html_body:
            message.attach_alternative(html_body, "text/html")
        # Failures must surface in logs; checkout already isolates notify from the response.
        sent = message.send(fail_silently=False)
        if sent:
            logger.info("sent event=%s to=%s subject=%s", event, email, subject)
        else:
            logger.error("notify returned 0 recipients event=%s to=%s", event, email)
    except Exception:
        logger.exception("Failed to notify event=%s to=%s", event, email)


def _load_order_context(order_id: int) -> dict[str, Any]:
    try:
        from apps.orders.models import Order

        order = (
            Order.objects.prefetch_related("items")
            .filter(pk=order_id)
            .first()
        )
    except Exception:
        logger.exception("Failed to load order %s for email", order_id)
        return {"order_id": order_id, "order_number": _format_order_number(order_id)}

    if order is None:
        return {"order_id": order_id, "order_number": _format_order_number(order_id)}

    items = [
        {
            "name": item.product_name_snapshot,
            "variant": item.variant_label_snapshot or "",
            "quantity": item.quantity,
            "line_total": _money(item.line_total),
            "unit_price": _money(item.unit_price),
        }
        for item in order.items.all()
    ]
    return {
        "order_id": order.id,
        "order_number": _format_order_number(order.id),
        "contact_name": order.contact_name,
        "contact_email": order.contact_email,
        "contact_phone": order.contact_phone,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "payment_method": order.get_payment_method_display()
        if hasattr(order, "get_payment_method_display")
        else order.payment_method,
        "status": order.get_status_display()
        if hasattr(order, "get_status_display")
        else order.status,
        "subtotal": _money(order.subtotal),
        "total": _money(order.total),
        "items": items,
        "courier_name": order.courier_name or "",
        "tracking_number": order.courier_tracking_number or "",
        "courier_notes": order.courier_notes or "",
        "storefront_url": getattr(
            settings, "VENI_STOREFRONT_URL", "http://127.0.0.1:5173"
        ).rstrip("/"),
    }


def _format_order_number(order_id: int) -> str:
    return f"VENI-{int(order_id):05d}"


def _money(value: Decimal | str | None) -> str:
    try:
        amount = Decimal(str(value or "0"))
    except Exception:
        return str(value or "0")
    quantized = amount.quantize(Decimal("0.01"))
    return f"Rs {quantized:,.2f}"


def _intro(event: str, context: dict[str, Any]) -> str:
    number = context.get("order_number", "your order")
    name = context.get("contact_name") or "there"
    if event == "order_created":
        return (
            f"Hello {name},\n\n"
            f"Thank you for ordering with Veni. We have received {number}."
        )
    if event == "payment_proof_uploaded":
        return (
            f"Hello {name},\n\n"
            f"We received your payment proof for {number}. "
            "An Admin will review it shortly."
        )
    if event == "payment_verified":
        return (
            f"Hello {name},\n\n"
            f"Payment for {number} was verified. We are preparing your order."
        )
    if event == "payment_rejected":
        reason = context.get("reason", "")
        return (
            f"Hello {name},\n\n"
            f"Payment proof for {number} was rejected. {reason} "
            "Please upload a new receipt on your order page."
        )
    if event == "order_shipped":
        return (
            f"Hello {name},\n\n"
            f"{number} has shipped."
        )
    if event == "tracking_updated":
        return (
            f"Hello {name},\n\n"
            f"Tracking details for {number} were updated."
        )
    if event == "password_reset":
        return context.get("message", "Use the link provided to reset your password.")
    return f"Veni notification for {number}."


def _render_text(event: str, context: dict[str, Any]) -> str:
    if event == "password_reset":
        return _intro(event, context)

    lines = [_intro(event, context), ""]
    if context.get("order_number"):
        lines.append(f"Order: {context['order_number']}")
    if context.get("status"):
        lines.append(f"Status: {context['status']}")
    if context.get("payment_method"):
        lines.append(f"Payment: {context['payment_method']}")
    lines.append("")

    items = context.get("items") or []
    if items:
        lines.append("Items:")
        for item in items:
            variant = f" ({item['variant']})" if item.get("variant") else ""
            lines.append(
                f"- {item['name']}{variant} × {item['quantity']} — {item['line_total']}"
            )
        lines.append("")

    if context.get("total"):
        lines.append(f"Total: {context['total']}")
        lines.append("")

    if context.get("shipping_address") or context.get("shipping_city"):
        lines.append("Ship to:")
        if context.get("contact_name"):
            lines.append(context["contact_name"])
        if context.get("shipping_address"):
            lines.append(context["shipping_address"])
        if context.get("shipping_city"):
            lines.append(context["shipping_city"])
        if context.get("contact_phone"):
            lines.append(context["contact_phone"])
        lines.append("")

    tracking = context.get("tracking_number") or ""
    courier = context.get("courier_name") or ""
    if tracking or courier:
        lines.append("Tracking:")
        if courier:
            lines.append(f"Courier: {courier}")
        if tracking:
            lines.append(f"Tracking ID: {tracking}")
        if context.get("courier_notes"):
            lines.append(f"Notes: {context['courier_notes']}")
        lines.append("")

    storefront = context.get("storefront_url") or ""
    if storefront and context.get("order_number"):
        lines.append(f"View your order: {storefront}")
    lines.append("")
    lines.append("— Veni")
    return "\n".join(lines)


def _render_html(event: str, context: dict[str, Any]) -> str:
    number = context.get("order_number", "")
    name = context.get("contact_name") or "there"
    intros = {
        "order_created": (
            f"Thank you for ordering with Veni. We have received "
            f"<strong>{number}</strong>."
        ),
        "payment_proof_uploaded": (
            f"We received your payment proof for <strong>{number}</strong>. "
            "An Admin will review it shortly."
        ),
        "payment_verified": (
            f"Payment for <strong>{number}</strong> was verified. "
            "We are preparing your order."
        ),
        "payment_rejected": (
            f"Payment proof for <strong>{number}</strong> was rejected. "
            f"{context.get('reason', '')} Please upload a new receipt on your order page."
        ),
        "order_shipped": f"<strong>{number}</strong> has shipped.",
        "tracking_updated": f"Tracking details for <strong>{number}</strong> were updated.",
    }
    lead = intros.get(event, f"Update for <strong>{number}</strong>.")

    item_rows = ""
    for item in context.get("items") or []:
        variant = (
            f'<div style="color:#57534e;font-size:12px;">{_escape(item.get("variant") or "")}</div>'
            if item.get("variant")
            else ""
        )
        item_rows += (
            "<tr>"
            f'<td style="padding:10px 0;border-bottom:1px solid #e7e5e4;">'
            f'<div style="font-weight:500;">{_escape(item["name"])}</div>{variant}'
            f'<div style="color:#57534e;font-size:12px;margin-top:4px;">Qty {item["quantity"]}</div>'
            "</td>"
            f'<td style="padding:10px 0;border-bottom:1px solid #e7e5e4;text-align:right;'
            f'white-space:nowrap;">{_escape(item["line_total"])}</td>'
            "</tr>"
        )

    tracking_block = ""
    if context.get("tracking_number") or context.get("courier_name"):
        tracking_block = (
            '<div style="margin:24px 0;padding:16px;border:1px solid #d6d3d1;'
            'border-radius:8px;background:#fafaf9;">'
            '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;'
            'color:#57534e;margin-bottom:8px;">Tracking</div>'
        )
        if context.get("courier_name"):
            tracking_block += (
                f'<div style="margin-bottom:4px;">Courier: '
                f'<strong>{_escape(context["courier_name"])}</strong></div>'
            )
        if context.get("tracking_number"):
            tracking_block += (
                f'<div>Tracking ID: <strong style="letter-spacing:0.04em;">'
                f'{_escape(context["tracking_number"])}</strong></div>'
            )
        tracking_block += "</div>"

    ship_block = ""
    if context.get("shipping_address") or context.get("shipping_city"):
        ship_lines = [
            _escape(context.get("contact_name") or ""),
            _escape(context.get("shipping_address") or ""),
            _escape(context.get("shipping_city") or ""),
            _escape(context.get("contact_phone") or ""),
        ]
        ship_block = (
            '<div style="margin:24px 0;">'
            '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;'
            'color:#57534e;margin-bottom:8px;">Ship to</div>'
            f'<div style="line-height:1.5;">{ "<br>".join(x for x in ship_lines if x)}</div>'
            "</div>"
        )

    meta = ""
    if context.get("status"):
        meta += f'<div>Status: <strong>{_escape(context["status"])}</strong></div>'
    if context.get("payment_method"):
        meta += f'<div>Payment: {_escape(context["payment_method"])}</div>'

    storefront = _escape(context.get("storefront_url") or "")
    cta = ""
    if storefront:
        cta = (
            f'<p style="margin:28px 0 0;">'
            f'<a href="{storefront}" style="color:#1c1917;font-weight:500;">'
            "Visit Veni</a></p>"
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f4;color:#0c0a09;
font-family:Jost,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
    style="background:#f5f5f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="max-width:560px;background:#ffffff;border:1px solid #d6d3d1;
        border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 28px 16px;border-bottom:1px solid #e7e5e4;">
          <div style="font-family:Jost,Helvetica,Arial,sans-serif;font-size:18px;
            font-weight:500;letter-spacing:0.32em;text-transform:uppercase;
            color:#0c0a09;">VENI</div>
        </td></tr>
        <tr><td style="padding:24px 28px 28px;">
          <p style="margin:0 0 8px;color:#57534e;font-size:14px;">Hello {_escape(name)},</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">{lead}</p>
          <div style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#44403c;">
            {meta}
            <div>Order: <strong>{_escape(number)}</strong></div>
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
            style="font-size:14px;">
            {item_rows}
            <tr>
              <td style="padding:14px 0 0;font-weight:600;">Total</td>
              <td style="padding:14px 0 0;text-align:right;font-weight:600;">
                {_escape(context.get("total") or "")}
              </td>
            </tr>
          </table>
          {tracking_block}
          {ship_block}
          {cta}
          <p style="margin:28px 0 0;font-size:12px;color:#78716c;line-height:1.5;">
            This message was sent to {_escape(context.get("contact_email") or "")}
            because an order was placed with this email on Veni.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _escape(value: str) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
