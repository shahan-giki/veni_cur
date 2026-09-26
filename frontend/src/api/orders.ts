import { ensureCsrfCookie, fetchJson } from "./client";
import type { OrderDetail, PaginatedOrders } from "./types/order";

export async function checkout(): Promise<OrderDetail> {
  await ensureCsrfCookie();
  return fetchJson<OrderDetail>("/checkout/", { method: "POST" });
}

export function listOrders(page = 1): Promise<PaginatedOrders> {
  const search = new URLSearchParams();
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return fetchJson<PaginatedOrders>(qs ? `/orders/?${qs}` : "/orders/");
}

export function getOrder(orderId: number): Promise<OrderDetail> {
  return fetchJson<OrderDetail>(`/orders/${orderId}/`);
}
