"""Admin dashboard summary and customer list APIs."""

from django.db.models import Count, Sum
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, UserRole
from apps.catalog.models import ProductVariant
from apps.orders.models import Order, OrderStatus
from apps.payments.models import Payment, PaymentStatus
from common.authentication import SessionAuthenticationWithCsrf
from common.pagination import VeniPageNumberPagination
from common.permissions import IsAdmin


class AdminDashboardView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(responses={200: dict})
    def get(self, request):
        pending_payments = Payment.objects.filter(status=PaymentStatus.PENDING).count()
        orders_awaiting_review = Order.objects.filter(
            status=OrderStatus.PAYMENT_VERIFICATION
        ).count()
        open_orders = Order.objects.exclude(
            status__in=(OrderStatus.SHIPPED, OrderStatus.CANCELLED)
        ).count()
        revenue = (
            Order.objects.filter(
                status__in=(
                    OrderStatus.PROCESSING,
                    OrderStatus.SHIPPED,
                    OrderStatus.PAYMENT_VERIFICATION,
                )
            ).aggregate(total=Sum("total"))["total"]
            or 0
        )
        low_stock = list(
            ProductVariant.objects.filter(is_active=True, inventory_count__lte=5)
            .select_related("product")
            .order_by("inventory_count")[:20]
            .values(
                "id",
                "sku",
                "inventory_count",
                "product_id",
                "product__name",
            )
        )
        return Response(
            {
                "pending_payments": pending_payments,
                "orders_awaiting_payment_review": orders_awaiting_review,
                "open_orders": open_orders,
                "revenue_in_progress": str(revenue),
                "low_stock": [
                    {
                        "variant_id": row["id"],
                        "sku": row["sku"],
                        "inventory_count": row["inventory_count"],
                        "product_id": row["product_id"],
                        "product_name": row["product__name"],
                    }
                    for row in low_stock
                ],
            }
        )


class AdminCustomerListView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = VeniPageNumberPagination

    @extend_schema(responses={200: dict})
    def get(self, request):
        qs = (
            User.objects.filter(role=UserRole.CUSTOMER)
            .annotate(order_count=Count("orders"))
            .order_by("-date_joined")
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        results = [
            {
                "id": u.id,
                "email": u.email,
                "first_name": u.first_name or "",
                "last_name": u.last_name or "",
                "order_count": u.order_count,
                "date_joined": u.date_joined,
                "is_active": u.is_active,
            }
            for u in page
        ]
        return paginator.get_paginated_response(results)
