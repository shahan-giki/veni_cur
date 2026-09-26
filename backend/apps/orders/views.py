from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Sum
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.serializers import OrderDetailSerializer, OrderListSerializer
from apps.orders.services.checkout_service import checkout_from_cart
from common.authentication import SessionAuthenticationWithCsrf
from common.pagination import VeniPageNumberPagination
from common.permissions import IsCustomer


class CheckoutView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(
        request=None,
        responses={201: OrderDetailSerializer},
    )
    def post(self, request):
        try:
            order = checkout_from_cart(request.user)
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise ValidationError(exc.message_dict) from exc
            messages = getattr(exc, "messages", None)
            if messages:
                raise ValidationError({"detail": messages[0]}) from exc
            raise ValidationError({"detail": str(exc)}) from exc
        data = OrderDetailSerializer(order).data
        return Response(data, status=201)


class CustomerOrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsCustomer]
    pagination_class = VeniPageNumberPagination
    lookup_field = "pk"

    def get_queryset(self):
        qs = Order.objects.filter(customer=self.request.user)
        if self.action == "list":
            return (
                qs.annotate(_item_count=Sum("items__quantity"))
                .prefetch_related("payments")
                .order_by("-created_at")
            )
        return qs.prefetch_related("items", "payments")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return OrderDetailSerializer
        return OrderListSerializer

    @extend_schema(responses={404: OpenApiResponse(description="Order not found")})
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
