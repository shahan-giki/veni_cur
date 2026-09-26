from django.core.exceptions import ValidationError
from django.db import transaction

from apps.catalog.models import Product, ProductImage
from apps.catalog.services.s3_storage import (
    get_product_image_storage,
    validate_product_image_upload,
)


@transaction.atomic
def request_upload_presign(*, product: Product, content_type: str, byte_size: int):
    storage = get_product_image_storage()
    return storage.create_presigned_upload(
        product_id=product.pk,
        content_type=content_type,
        byte_size=byte_size,
    )


@transaction.atomic
def confirm_product_image(
    *,
    product: Product,
    s3_key: str,
    alt_text: str = "",
    content_type: str = "",
    byte_size: int | None = None,
    sort_order: int | None = None,
) -> ProductImage:
    if not s3_key.startswith(f"products/{product.pk}/"):
        raise ValidationError({"s3_key": "Invalid object key for this product."})
    if ProductImage.objects.filter(s3_key=s3_key).exists():
        raise ValidationError({"s3_key": "Image already registered."})
    if content_type and byte_size is not None:
        validate_product_image_upload(content_type=content_type, byte_size=byte_size)
    if sort_order is None:
        last = (
            ProductImage.objects.filter(product=product)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        sort_order = (last or 0) + 1
    return ProductImage.objects.create(
        product=product,
        s3_key=s3_key,
        alt_text=alt_text,
        sort_order=sort_order,
        content_type=content_type,
        byte_size=byte_size,
    )


@transaction.atomic
def reorder_images(product: Product, ordered_image_ids: list[int]) -> None:
    images = list(ProductImage.objects.filter(product=product))
    by_id = {img.id: img for img in images}
    if set(ordered_image_ids) != set(by_id.keys()):
        raise ValidationError(
            {"ordered_image_ids": "Must include all product images exactly once."}
        )
    for index, image_id in enumerate(ordered_image_ids):
        by_id[image_id].sort_order = index
    ProductImage.objects.bulk_update(by_id.values(), ["sort_order", "updated_at"])


@transaction.atomic
def delete_product_image(image: ProductImage) -> None:
    storage = get_product_image_storage()
    s3_key = image.s3_key
    image.delete()
    try:
        storage.delete_object(s3_key=s3_key)
    except Exception:
        # Metadata removed; orphan cleanup can be retried operationally.
        pass
