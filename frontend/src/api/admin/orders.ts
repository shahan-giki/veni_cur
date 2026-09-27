import { ensureCsrfCookie, fetchJson } from "../client";
import type { PaymentMethod } from "../types/order";

export type CourierSlip = {
  order_number: string;
  consignee_name: string;
  consignee_phone: string;
  consignee_email: string;
  consignee_address: string;
  consignee_city: string;
  pieces: number;
  payment_mode: "COD" | "Prepaid";
  cod_amount: string;
  product_description: string;
  order_total: string;
  courier_name: string;
  tracking_number: string;
  notes: string;
};

export type AdminOrderSummary = {
  id: number;
  status: string;
  payment_method: PaymentMethod;
  customer_email: string;
  subtotal: string;
  total: string;
  item_count: number;
  pending_payment_id: number | null;
  created_at: string;
};

export type AdminOrderDetail = AdminOrderSummary & {
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  shipping_address: string;
  shipping_city: string;
  courier_name: string;
  courier_tracking_number: string;
  courier_notes: string;
  courier_slip?: CourierSlip;
  items: Array<{
    id: number;
    product_name_snapshot: string;
    variant_label_snapshot: string;
    sku_snapshot: string;
    unit_price: string;
    quantity: number;
    line_total: string;
  }>;
  payments: Array<{
    id: number;
    status: string;
    amount: string;
    reference_number: string;
    rejection_reason: string;
    created_at: string;
    updated_at: string;
  }>;
  updated_at: string;
};

export type PaginatedAdminOrders = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminOrderSummary[];
};

export function listAdminOrders(params?: {
  page?: number;
  status?: string;
}): Promise<PaginatedAdminOrders> {
  const search = new URLSearchParams();
  if (params?.page && params.page > 1) search.set("page", String(params.page));
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  return fetchJson(qs ? `/admin/orders/?${qs}` : "/admin/orders/");
}

export function getAdminOrder(id: number): Promise<AdminOrderDetail> {
  return fetchJson(`/admin/orders/${id}/`);
}

export async function patchAdminOrderStatus(
  id: number,
  status: "SHIPPED" | "CANCELLED"
): Promise<AdminOrderDetail> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/orders/${id}/status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function patchAdminOrderCourier(
  id: number,
  payload: { courier_name: string; tracking_number: string; notes?: string }
): Promise<AdminOrderDetail> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/orders/${id}/courier/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
