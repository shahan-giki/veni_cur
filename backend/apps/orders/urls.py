from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.orders.admin_views import (
    AdminOrderCourierView,
    AdminOrderStatusView,
    AdminOrderViewSet,
)
from apps.orders.views import (
    CheckoutView,
    CustomerOrderViewSet,
    GuestCheckoutView,
    GuestOrderByTokenView,
)

router = DefaultRouter()
router.register("orders", CustomerOrderViewSet, basename="customer-order")

admin_router = DefaultRouter()
admin_router.register("orders", AdminOrderViewSet, basename="admin-order")

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("checkout/guest/", GuestCheckoutView.as_view(), name="guest-checkout"),
    path(
        "orders/by-token/<uuid:access_token>/",
        GuestOrderByTokenView.as_view(),
        name="guest-order-by-token",
    ),
    path(
        "admin/orders/<int:pk>/status/",
        AdminOrderStatusView.as_view(),
        name="admin-order-status",
    ),
    path(
        "admin/orders/<int:pk>/courier/",
        AdminOrderCourierView.as_view(),
        name="admin-order-courier",
    ),
    path("admin/", include(admin_router.urls)),
    path("", include(router.urls)),
]
