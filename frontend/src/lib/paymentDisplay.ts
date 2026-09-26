import type { PaymentStatus } from "../api/types/payment";

const labels: Record<PaymentStatus, string> = {
  PENDING: "Payment is being verified",
  VERIFIED: "Payment verified",
  REJECTED: "Payment proof rejected",
};

export function formatPaymentStatus(status: PaymentStatus | string | null | undefined): string {
  if (!status) return "—";
  return labels[status as PaymentStatus] ?? status.replace(/_/g, " ").toLowerCase();
}
