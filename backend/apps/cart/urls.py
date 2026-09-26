from django.urls import path

from apps.cart.views import CartDetailView, CartItemDetailView, CartItemListCreateView

urlpatterns = [
    path("", CartDetailView.as_view(), name="cart-detail"),
    path("items/", CartItemListCreateView.as_view(), name="cart-items"),
    path("items/<int:item_id>/", CartItemDetailView.as_view(), name="cart-item-detail"),
]
