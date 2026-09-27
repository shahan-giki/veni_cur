from django.contrib.auth import authenticate

from apps.accounts.models import User, UserRole


def register_customer(
    *,
    email: str,
    password: str,
    first_name: str = "",
    last_name: str = "",
) -> User:
    """Create a storefront Customer. The role is server-owned, never client-settable."""
    return User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=UserRole.CUSTOMER,
    )


def authenticate_email_password(*, email: str, password: str) -> User | None:
    user = authenticate(username=email, password=password)
    if user is None:
        return None
    if not user.is_active:
        return None
    return user
