import { ensureCsrfCookie, fetchJson } from "../client";

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  sort_order: number;
  is_active: boolean;
  is_visible: boolean;
};

export type AdminProduct = {
  id: number;
  category: number;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  sale_price: string | null;
  sku: string;
  status: string;
  is_active: boolean;
};

export type AdminVariant = {
  id: number;
  product: number;
  sku: string;
  label: string;
  price: string | null;
  inventory_count: number;
  attributes: Record<string, unknown>;
  is_default: boolean;
  is_active: boolean;
};

export type AdminProductImage = {
  id: number;
  s3_key: string;
  alt_text: string;
  sort_order: number;
  read_url: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function listAdminCategories(): Promise<Paginated<AdminCategory>> {
  return fetchJson("/admin/categories/?page_size=100");
}

export async function createAdminCategory(
  body: Partial<AdminCategory>
): Promise<AdminCategory> {
  await ensureCsrfCookie();
  return fetchJson("/admin/categories/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateAdminCategory(
  id: number,
  body: Partial<AdminCategory>
): Promise<AdminCategory> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/categories/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function listAdminProducts(page = 1): Promise<Paginated<AdminProduct>> {
  return fetchJson(`/admin/products/?page=${page}`);
}

export function getAdminProduct(id: number): Promise<AdminProduct> {
  return fetchJson(`/admin/products/${id}/`);
}

export async function createAdminProduct(
  body: Partial<AdminProduct>
): Promise<AdminProduct> {
  await ensureCsrfCookie();
  return fetchJson("/admin/products/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateAdminProduct(
  id: number,
  body: Partial<AdminProduct>
): Promise<AdminProduct> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/products/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function activateAdminProduct(id: number): Promise<AdminProduct> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/products/${id}/activate/`, { method: "POST" });
}

export async function deactivateAdminProduct(id: number): Promise<AdminProduct> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/products/${id}/deactivate/`, { method: "POST" });
}

export function listAdminVariants(productId: number): Promise<Paginated<AdminVariant>> {
  return fetchJson(`/admin/variants/?product=${productId}&page_size=50`);
}

export async function createAdminVariant(body: Partial<AdminVariant>): Promise<AdminVariant> {
  await ensureCsrfCookie();
  return fetchJson("/admin/variants/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateAdminVariant(
  id: number,
  body: Partial<AdminVariant>
): Promise<AdminVariant> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/variants/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteAdminVariant(id: number): Promise<void> {
  await ensureCsrfCookie();
  await fetchJson(`/admin/variants/${id}/`, { method: "DELETE" });
}

export async function patchVariantInventory(
  id: number,
  inventory_count: number
): Promise<AdminVariant> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/variants/${id}/inventory/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inventory_count }),
  });
}

export function listAdminProductImages(productId: number): Promise<AdminProductImage[]> {
  return fetchJson(`/admin/products/${productId}/images/`);
}

export async function presignAdminProductImage(
  productId: number,
  contentType: string,
  byteSize: number
) {
  await ensureCsrfCookie();
  return fetchJson<{
    upload_url: string;
    fields: Record<string, string>;
    s3_key: string;
  }>(`/admin/products/${productId}/images/presign-upload/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: contentType, byte_size: byteSize }),
  });
}

export async function confirmAdminProductImage(
  productId: number,
  s3Key: string,
  altText: string
): Promise<AdminProductImage> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/products/${productId}/images/confirm-upload/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3_key: s3Key, alt_text: altText }),
  });
}

export type AdminVariantOption = {
  key: string;
  label: string;
  kind: "text" | "color";
  placeholder: string;
  suggestions: string[];
  sort_order: number;
  recommended: boolean;
};

export function listAdminVariantOptions(params?: {
  categoryId?: number;
  categorySlug?: string;
}): Promise<AdminVariantOption[]> {
  const qs = new URLSearchParams();
  if (params?.categoryId != null) qs.set("category", String(params.categoryId));
  if (params?.categorySlug) qs.set("category_slug", params.categorySlug);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchJson(`/admin/variant-options/${suffix}`);
}

export async function deleteAdminProductImage(
  productId: number,
  imageId: number
): Promise<void> {
  await ensureCsrfCookie();
  await fetchJson(`/admin/products/${productId}/images/${imageId}/`, {
    method: "DELETE",
  });
}
