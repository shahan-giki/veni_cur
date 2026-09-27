import { ensureCsrfCookie, fetchJson } from "./client";
import type { CheckoutContact, OrderDetail, PaginatedOrders } from "./types/order";

export async function checkout(contact: CheckoutContact): Promise<OrderDetail> {
  await ensureCsrfCookie();
  return fetchJson<OrderDetail>("/checkout/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
}

export async function guestCheckout(contact: CheckoutContact): Promise<OrderDetail> {
  await ensureCsrfCookie();
  return fetchJson<OrderDetail>("/checkout/guest/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
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

export function getOrderByToken(accessToken: string): Promise<OrderDetail> {
  return fetchJson<OrderDetail>(`/orders/by-token/${accessToken}/`);
}
