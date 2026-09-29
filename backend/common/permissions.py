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


class IsCustomerOrGuest(BasePermission):
    """Storefront cart is open to anyone.

    Customers get a user-owned cart; guests and admins (e.g. after seeding the
    catalog) share the session cart. Cart views resolve ownership separately.
    """

    message = "Customer or guest access required."

    def has_permission(self, request, view):
        return True


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
