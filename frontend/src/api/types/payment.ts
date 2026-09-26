export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type CustomerPaymentState = {
  can_upload_proof: boolean;
  status: PaymentStatus | null;
  rejection_reason: string;
  reference_number: string;
  updated_at: string | null;
};

export type ManualPaymentInstructions = {
  currency: string;
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  instructions: string;
};

export type PresignPaymentProofResponse = {
  upload_url: string;
  fields: Record<string, string>;
  s3_key: string;
  expires_in: number;
};

export type PaymentRecord = {
  id: number;
  status: PaymentStatus;
  amount: string;
  reference_number: string;
  created_at: string;
  updated_at: string;
};
