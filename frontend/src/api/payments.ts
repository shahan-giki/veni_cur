import { ensureCsrfCookie, fetchJson } from "./client";
import type {
  ManualPaymentInstructions,
  PaymentRecord,
  PresignPaymentProofResponse,
} from "./types/payment";

export function getPaymentInstructions(): Promise<ManualPaymentInstructions> {
  return fetchJson("/payments/instructions/");
}

export async function presignPaymentProof(
  orderId: number,
  file: File
): Promise<PresignPaymentProofResponse> {
  await ensureCsrfCookie();
  return fetchJson("/payments/presign/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      file_type: file.type,
      file_name: file.name,
      byte_size: file.size,
    }),
  });
}

export async function confirmPaymentProof(
  orderId: number,
  s3Key: string,
  referenceNumber: string
): Promise<PaymentRecord> {
  await ensureCsrfCookie();
  return fetchJson("/payments/confirm/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      s3_key: s3Key,
      reference_number: referenceNumber,
    }),
  });
}

export async function uploadProofToS3(
  presign: PresignPaymentProofResponse,
  file: File
): Promise<void> {
  if (presign.upload_url.includes("fake-s3.test")) {
    return;
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(presign.fields)) {
    form.append(key, value);
  }
  form.append("file", file);
  const response = await fetch(presign.upload_url, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error("Upload to storage failed.");
  }
}
