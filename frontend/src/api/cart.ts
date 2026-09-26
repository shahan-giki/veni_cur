import { ensureCsrfCookie, fetchJson } from "./client";
import type { Cart } from "./types/cart";

export function getCart(): Promise<Cart> {
  return fetchJson<Cart>("/cart/");
}

export async function addCartItem(variantId: number, quantity: number): Promise<Cart> {
  await ensureCsrfCookie();
  return fetchJson<Cart>("/cart/items/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  await ensureCsrfCookie();
  return fetchJson<Cart>(`/cart/items/${itemId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  await ensureCsrfCookie();
  return fetchJson<Cart>(`/cart/items/${itemId}/`, { method: "DELETE" });
}

export async function clearCart(): Promise<Cart> {
  await ensureCsrfCookie();
  return fetchJson<Cart>("/cart/", { method: "DELETE" });
}
