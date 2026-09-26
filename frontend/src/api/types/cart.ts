export type CartItem = {
  id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  variant_label: string;
  variant_attributes: Record<string, unknown>;
  sku: string;
  inventory_count: number;
  unit_price: string;
  quantity: number;
  line_total: string;
  primary_image_url: string | null;
};

export type Cart = {
  id: number;
  items: CartItem[];
  subtotal: string;
  item_count: number;
  line_count: number;
  updated_at: string;
};
