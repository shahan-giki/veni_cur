import { ensureCsrfCookie, fetchJson } from "../client";
import type { PaymentRecord } from "../types/payment";

export type AdminProofUrl = {
  url: string;
  expires_in: number;
};

export type { PaymentRecord };

export function getAdminPaymentProof(paymentId: number): Promise<AdminProofUrl> {
  return fetchJson(`/admin/payments/${paymentId}/proof/`);
}

export async function verifyAdminPayment(paymentId: number): Promise<PaymentRecord> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/payments/${paymentId}/verify/`, { method: "POST" });
}

export async function rejectAdminPayment(
  paymentId: number,
  reason: string
): Promise<PaymentRecord> {
  await ensureCsrfCookie();
  return fetchJson(`/admin/payments/${paymentId}/reject/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}
