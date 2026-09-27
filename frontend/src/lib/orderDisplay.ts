import type { OrderItem } from "../api/types/order";
import { formatVariantDetail } from "./variantDisplay";

export function formatOrderNumber(orderId: number): string {
  return `VENI-${String(orderId).padStart(5, "0")}`;
}

export function orderItemVariantLabel(item: OrderItem): string {
  return formatVariantDetail(
    item.variant_label_snapshot,
    item.variant_attributes_snapshot
  );
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

/** CSS modifier for status badge emphasis. */
export function orderStatusTone(
  status: string
): "pending" | "review" | "processing" | "shipped" | "cancelled" | "neutral" {
  switch (status) {
    case "PENDING_PAYMENT":
      return "pending";
    case "PAYMENT_VERIFICATION":
      return "review";
    case "PROCESSING":
      return "processing";
    case "SHIPPED":
      return "shipped";
    case "CANCELLED":
      return "cancelled";
    default:
      return "neutral";
  }
}

export type OrderPlacedParts = {
  day: string;
  date: string;
  time: string;
};

/** Split an ISO timestamp into easy-to-read day / date / time fields. */
export function formatOrderPlacedAt(
  iso: string,
  locale = "en-PK"
): OrderPlacedParts {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { day: "—", date: "—", time: "—" };
  }
  return {
    day: d.toLocaleDateString(locale, { weekday: "long" }),
    date: d.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

const paymentMethodLabels: Record<string, string> = {
  MANUAL_TRANSFER: "Bank / wallet transfer",
  CASH_ON_DELIVERY: "Cash on delivery",
};

export function formatPaymentMethod(method: string): string {
  return paymentMethodLabels[method] ?? method.replace(/_/g, " ").toLowerCase();
}
