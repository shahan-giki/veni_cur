/** Phase 3 catalog API types — for Phase 4 storefront integration. */

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  parent_slug: string | null;
  sort_order: number;
};

export type PublicCategoryDetail = PublicCategory & {
  children?: Pick<PublicCategory, "id" | "name" | "slug" | "sort_order">[];
};

export type PublicProductVariant = {
  id: number;
  sku: string;
  label: string;
  effective_price: string;
  inventory_count: number;
  attributes: Record<string, unknown>;
  is_default: boolean;
};

export type PublicProductListItem = {
  id: number;
  name: string;
  slug: string;
  category_slug: string;
  description: string;
  effective_price: string;
  primary_image_url: string | null;
};

export type PublicProductDetail = PublicProductListItem & {
  variants: PublicProductVariant[];
  images: { id: number; alt_text: string; sort_order: number; url: string | null }[];
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
