import type { CustomerPaymentState, PaymentStatus } from "./payment";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_VERIFICATION"
  | "PROCESSING"
  | "SHIPPED";

export type OrderItem = {
  id: number;
  product_name_snapshot: string;
  variant_label_snapshot: string;
  variant_attributes_snapshot: Record<string, string>;
  sku_snapshot: string;
  unit_price: string;
  quantity: number;
  line_total: string;
};

export type OrderSummary = {
  id: number;
  status: OrderStatus;
  subtotal: string;
  total: string;
  item_count: number;
  payment_status: PaymentStatus | null;
  created_at: string;
};

export type OrderDetail = OrderSummary & {
  items: OrderItem[];
  payment: CustomerPaymentState;
  updated_at: string;
};

export type PaginatedOrders = {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrderSummary[];
};
