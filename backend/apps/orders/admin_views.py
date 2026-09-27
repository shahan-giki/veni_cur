from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.admin_serializers import (
    AdminCourierDetailsSerializer,
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    AdminOrderStatusSerializer,
)
from apps.orders.models import Order
from apps.orders.services.admin_order_service import update_order_status
from apps.orders.services.courier_service import (
    build_courier_slip,
    update_courier_details,
)
from common.authentication import SessionAuthenticationWithCsrf
from common.exceptions import raise_drf_validation_error
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

    def retrieve(self, request, *args, **kwargs):
        order = self.get_object()
        data = AdminOrderDetailSerializer(order).data
        data["courier_slip"] = build_courier_slip(order)
        return Response(data)


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
            raise_drf_validation_error(exc)
        order = (
            Order.objects.select_related("customer")
            .prefetch_related("items", "payments")
            .get(pk=order.pk)
        )
        data = AdminOrderDetailSerializer(order).data
        data["courier_slip"] = build_courier_slip(order)
        return Response(data)


class AdminOrderCourierView(APIView):
    """Save courier booking details and return an updated courier-ready slip."""

    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        request=AdminCourierDetailsSerializer,
        responses={200: AdminOrderDetailSerializer},
    )
    def patch(self, request, pk: int):
        serializer = AdminCourierDetailsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        order = update_courier_details(
            order_id=pk,
            courier_name=data.get("courier_name", ""),
            tracking_number=data.get("tracking_number", ""),
            notes=data.get("notes", ""),
        )
        order = (
            Order.objects.select_related("customer")
            .prefetch_related("items", "payments")
            .get(pk=order.pk)
        )
        payload = AdminOrderDetailSerializer(order).data
        payload["courier_slip"] = build_courier_slip(order)
        return Response(payload)
