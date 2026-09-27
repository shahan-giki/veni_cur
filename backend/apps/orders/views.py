from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.serializers import (
    CheckoutContactSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
)
from apps.orders.services.checkout_service import (
    ContactDetails,
    checkout_from_cart,
    checkout_from_session_cart,
)
from common.authentication import SessionAuthenticationWithCsrf
from common.exceptions import raise_drf_validation_error
from common.pagination import VeniPageNumberPagination
from common.permissions import IsCustomer


class CheckoutView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(
        request=CheckoutContactSerializer,
        responses={201: OrderDetailSerializer},
    )
    def post(self, request):
        serializer = CheckoutContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        payment_method = data.pop("payment_method", "MANUAL_TRANSFER")
        try:
            order = checkout_from_cart(
                request.user,
                ContactDetails(**data),
                payment_method=payment_method,
            )
        except DjangoValidationError as exc:
            raise_drf_validation_error(exc)
        return Response(OrderDetailSerializer(order).data, status=201)


class GuestCheckoutView(APIView):
    """Checkout for a visitor with no account (ADR-0003).

    Uses the server-side session Cart (same as browse/add), then clears it.
    """

    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [AllowAny]

    @extend_schema(
        request=CheckoutContactSerializer,
        responses={201: OrderDetailSerializer},
    )
    def post(self, request):
        if not request.session.session_key:
            request.session.create()
        serializer = CheckoutContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        payment_method = data.pop("payment_method", "MANUAL_TRANSFER")
        try:
            order = checkout_from_session_cart(
                request.session.session_key,
                ContactDetails(**data),
                payment_method=payment_method,
            )
        except DjangoValidationError as exc:
            raise_drf_validation_error(exc)
        return Response(OrderDetailSerializer(order).data, status=201)


class GuestOrderByTokenView(APIView):
    """A guest's only route back to their Order: the opaque token stands in for a login."""

    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [AllowAny]

    @extend_schema(responses={200: OrderDetailSerializer})
    def get(self, request, access_token):
        order = get_object_or_404(
            Order.objects.prefetch_related("items", "payments"),
            access_token=access_token,
        )
        return Response(OrderDetailSerializer(order).data)


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
