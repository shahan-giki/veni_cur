import type { OrderItem } from "../api/types/order";

export function orderItemVariantLabel(item: OrderItem): string {
  if (item.variant_label_snapshot.trim()) {
    return item.variant_label_snapshot.trim();
  }
  const parts = Object.entries(item.variant_attributes_snapshot ?? {})
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length ? parts.join(" · ") : "Standard";
}

const orderStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAYMENT_VERIFICATION: "Payment verification",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
};

export function formatOrderStatus(status: string): string {
  return orderStatusLabels[status] ?? status.replace(/_/g, " ").toLowerCase();
}
