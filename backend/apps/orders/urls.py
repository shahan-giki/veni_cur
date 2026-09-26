from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.orders.admin_views import AdminOrderStatusView, AdminOrderViewSet
from apps.orders.views import CheckoutView, CustomerOrderViewSet

router = DefaultRouter()
router.register("orders", CustomerOrderViewSet, basename="customer-order")

admin_router = DefaultRouter()
admin_router.register("orders", AdminOrderViewSet, basename="admin-order")

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path(
        "admin/orders/<int:pk>/status/",
        AdminOrderStatusView.as_view(),
        name="admin-order-status",
    ),
    path("admin/", include(admin_router.urls)),
    path("", include(router.urls)),
]
