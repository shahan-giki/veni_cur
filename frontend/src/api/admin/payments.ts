import { ensureCsrfCookie, fetchJson } from "../client";

export type AdminProofUrl = {
  url: string;
  expires_in: number;
};

export type PaymentRecord = {
  id: number;
  status: string;
  amount: string;
  reference_number: string;
  created_at: string;
  updated_at: string;
};

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
