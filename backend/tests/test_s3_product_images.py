import pytest
from django.core.exceptions import ValidationError

from apps.catalog.services import product_image_service
from apps.catalog.services.s3_storage import validate_product_image_upload


def test_reject_invalid_mime():
    with pytest.raises(ValidationError):
        validate_product_image_upload(content_type="application/pdf", byte_size=1000)


def test_reject_oversized():
    with pytest.raises(ValidationError):
        validate_product_image_upload(content_type="image/png", byte_size=50_000_000)


@pytest.mark.django_db
def test_s3_key_must_match_product_prefix(published_product):
    with pytest.raises(ValidationError):
        product_image_service.confirm_product_image(
            product=published_product,
            s3_key="products/99999/evil.png",
            content_type="image/png",
            byte_size=100,
        )


@pytest.mark.django_db
def test_presign_and_confirm_flow(published_product, settings):
    settings.PRODUCT_IMAGE_STORAGE_BACKEND = "memory"
    presigned = product_image_service.request_upload_presign(
        product=published_product,
        content_type="image/png",
        byte_size=1024,
    )
    assert presigned.s3_key.startswith(f"products/{published_product.pk}/")
    image = product_image_service.confirm_product_image(
        product=published_product,
        s3_key=presigned.s3_key,
        content_type="image/png",
        byte_size=1024,
        alt_text="Front",
    )
    assert image.sort_order == 1


@pytest.mark.django_db
def test_delete_removes_metadata(published_product, settings):
    settings.PRODUCT_IMAGE_STORAGE_BACKEND = "memory"
    presigned = product_image_service.request_upload_presign(
        product=published_product,
        content_type="image/jpeg",
        byte_size=500,
    )
    image = product_image_service.confirm_product_image(
        product=published_product,
        s3_key=presigned.s3_key,
        content_type="image/jpeg",
        byte_size=500,
    )
    product_image_service.delete_product_image(image)
    from apps.catalog.models import ProductImage

    assert not ProductImage.objects.filter(pk=image.pk).exists()
