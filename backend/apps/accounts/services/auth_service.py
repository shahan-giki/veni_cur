from django.contrib.auth import authenticate

from apps.accounts.models import User


def authenticate_email_password(*, email: str, password: str) -> User | None:
    user = authenticate(username=email, password=password)
    if user is None:
        return None
    if not user.is_active:
        return None
    return user
