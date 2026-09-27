from django.contrib.auth import password_validation
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

from apps.accounts.models import User
from common.notifications import notify


def request_password_reset(*, email: str, reset_path_template: str) -> None:
    """Always succeed from the caller's view; only email known users."""
    user = User.objects.filter(email__iexact=email).first()
    if user is None:
        return
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = reset_path_template.format(uid=uid, token=token)
    notify(
        "password_reset",
        email=user.email,
        context={
            "message": (
                f"Reset your Veni password using this link (expires soon):\n{link}\n"
                "If you did not request this, ignore this email."
            )
        },
    )


def confirm_password_reset(*, uid: str, token: str, new_password: str) -> User:
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError) as exc:
        raise serializers.ValidationError(
            {"detail": "Invalid or expired reset link."}
        ) from exc
    if not default_token_generator.check_token(user, token):
        raise serializers.ValidationError({"detail": "Invalid or expired reset link."})
    password_validation.validate_password(new_password, user)
    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user


def change_password(*, user: User, current_password: str, new_password: str) -> None:
    if not user.check_password(current_password):
        raise serializers.ValidationError(
            {"current_password": "Current password is incorrect."}
        )
    password_validation.validate_password(new_password, user)
    user.set_password(new_password)
    user.save(update_fields=["password"])
