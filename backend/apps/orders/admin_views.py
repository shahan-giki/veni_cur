from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.admin_serializers import (
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    AdminOrderStatusSerializer,
)
from apps.orders.models import Order
from apps.orders.services.admin_order_service import update_order_status
from common.authentication import SessionAuthenticationWithCsrf
from common.pagination import VeniPageNumberPagination
from common.permissions import IsAdmin


class AdminOrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = VeniPageNumberPagination
    lookup_field = "pk"

    def get_queryset(self):
        qs = Order.objects.select_related("customer").prefetch_related(
            "items", "payments"
        )
        if self.action == "list":
            status = self.request.query_params.get("status")
            if status:
                qs = qs.filter(status=status)
            return qs.annotate(_item_count=Sum("items__quantity")).order_by(
                "-created_at"
            )
        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AdminOrderDetailSerializer
        return AdminOrderListSerializer


class AdminOrderStatusView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        request=AdminOrderStatusSerializer,
        responses={200: AdminOrderDetailSerializer},
    )
    def patch(self, request, pk: int):
        serializer = AdminOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order = update_order_status(
                order_id=pk,
                new_status=serializer.validated_data["status"],
            )
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise ValidationError(exc.message_dict) from exc
            raise ValidationError({"detail": str(exc)}) from exc
        order = (
            Order.objects.select_related("customer")
            .prefetch_related("items", "payments")
            .get(pk=order.pk)
        )
        return Response(AdminOrderDetailSerializer(order).data)
