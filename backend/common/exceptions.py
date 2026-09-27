from typing import NoReturn

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DrfValidationError


def raise_drf_validation_error(exc: DjangoValidationError) -> NoReturn:
    """Re-raise a service-layer Django ValidationError as the DRF equivalent.

    Field errors keep their field keys; anything non-field collapses to ``detail``.
    """
    if hasattr(exc, "message_dict"):
        raise DrfValidationError(exc.message_dict) from exc
    messages = getattr(exc, "messages", None)
    if messages:
        raise DrfValidationError({"detail": messages[0]}) from exc
    raise DrfValidationError({"detail": str(exc)}) from exc
