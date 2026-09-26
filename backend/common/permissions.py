from rest_framework.permissions import BasePermission

from apps.accounts.models import UserRole


class IsCustomer(BasePermission):
    """Authenticated user with CUSTOMER role (storefront cart)."""

    message = "Customer access required."

    def has_permission(self, request, view):
        user = request.user
        return (
            user
            and user.is_authenticated
            and getattr(user, "role", None) == UserRole.CUSTOMER
        )


class IsAdmin(BasePermission):
    """Authenticated user with ADMIN role (ADR-0001)."""

    message = "Admin access required."

    def has_permission(self, request, view):
        user = request.user
        return (
            user
            and user.is_authenticated
            and getattr(user, "role", None) == UserRole.ADMIN
        )
