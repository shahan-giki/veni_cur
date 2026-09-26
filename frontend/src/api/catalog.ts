import { fetchJson, getApiBaseUrl } from "./client";
import type {
  Paginated,
  PublicCategory,
  PublicCategoryDetail,
  PublicProductDetail,
  PublicProductListItem,
} from "./types/catalog";

export { getApiBaseUrl };

export type ProductListParams = {
  category?: string;
  q?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};

export function listCategories(): Promise<PublicCategory[]> {
  return fetchJson<PublicCategory[]>("/categories/");
}

export function getCategory(slug: string): Promise<PublicCategoryDetail> {
  return fetchJson(`/categories/${slug}/`);
}

export function listProducts(
  params: ProductListParams = {}
): Promise<Paginated<PublicProductListItem>> {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.ordering) search.set("ordering", params.ordering);
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  const qs = search.toString();
  const path = qs ? `/products/?${qs}` : "/products/";
  return fetchJson(path);
}

export function getProduct(slug: string): Promise<PublicProductDetail> {
  return fetchJson(`/products/${slug}/`);
}
