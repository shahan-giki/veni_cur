from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.cart.serializers import (
    CartItemQuantitySerializer,
    CartItemWriteSerializer,
    CartSerializer,
    serialize_cart,
)
from apps.cart.services import cart_service
from apps.catalog.services.s3_storage import get_product_image_storage
from common.authentication import SessionAuthenticationWithCsrf
from common.exceptions import raise_drf_validation_error
from common.permissions import IsCustomerOrGuest


def _image_context(cart) -> tuple[dict[str, str], dict[int, str]]:
    keys: list[str] = []
    primary_by_product: dict[int, str] = {}
    for item in cart.items.all():
        product_id = item.product_variant.product_id
        if product_id in primary_by_product:
            continue
        key = cart_service.primary_image_key_for_product(product_id)
        if key:
            primary_by_product[product_id] = key
            keys.append(key)
    urls: dict[str, str] = {}
    if keys:
        storage = get_product_image_storage()
        urls = {
            key: storage.create_presigned_read(s3_key=key).url for key in keys
        }
    return urls, primary_by_product


def _cart_response(cart) -> Response:
    image_urls, primary_keys = _image_context(cart)
    data = serialize_cart(
        cart, image_urls=image_urls, primary_image_keys=primary_keys
    )
    return Response(data)


def _cart_owner(request) -> dict:
    user = request.user
    if user.is_authenticated and getattr(user, "role", None) == UserRole.CUSTOMER:
        return {"user": user, "session_key": None}
    if not request.session.session_key:
        request.session.save()
    return {"user": None, "session_key": request.session.session_key}


class CartDetailView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsCustomerOrGuest]

    @extend_schema(responses={200: CartSerializer})
    def get(self, request):
        cart = cart_service.get_cart_with_items(**_cart_owner(request))
        return _cart_response(cart)

    @extend_schema(responses={200: CartSerializer})
    def delete(self, request):
        try:
            cart = cart_service.clear_cart(**_cart_owner(request))
        except DjangoValidationError as exc:
            raise_drf_validation_error(exc)
        return _cart_response(cart)


class CartItemListCreateView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsCustomerOrGuest]

    @extend_schema(request=CartItemWriteSerializer, responses={200: CartSerializer})
    def post(self, request):
        serializer = CartItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            cart = cart_service.add_item(
                **_cart_owner(request),
                variant_id=serializer.validated_data["variant_id"],
                quantity=serializer.validated_data["quantity"],
            )
        except DjangoValidationError as exc:
            raise_drf_validation_error(exc)
        return _cart_response(cart)


class CartItemDetailView(APIView):
    authentication_classes = [SessionAuthenticationWithCsrf]
    permission_classes = [IsCustomerOrGuest]

    @extend_schema(request=CartItemQuantitySerializer, responses={200: CartSerializer})
    def patch(self, request, item_id: int):
        serializer = CartItemQuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            cart = cart_service.update_item_quantity(
                **_cart_owner(request),
                item_id=item_id,
                quantity=serializer.validated_data["quantity"],
            )
        except DjangoValidationError as exc:
            raise_drf_validation_error(exc)
        return _cart_response(cart)

    @extend_schema(responses={200: CartSerializer})
    def delete(self, request, item_id: int):
        try:
            cart = cart_service.remove_item(
                **_cart_owner(request), item_id=item_id
            )
        except DjangoValidationError as exc:
            raise_drf_validation_error(exc)
        return _cart_response(cart)
