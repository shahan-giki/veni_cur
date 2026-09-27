import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as paymentsApi from "../../api/payments";
import { renderWithProviders } from "../../test/testUtils";
import { PaymentProofUpload } from "./PaymentProofUpload";

vi.mock("../../api/payments", () => ({
  getPaymentInstructions: vi.fn(),
  presignPaymentProof: vi.fn(),
  confirmPaymentProof: vi.fn(),
  uploadProofToS3: vi.fn(),
}));

describe("PaymentProofUpload", () => {
  beforeEach(() => {
    vi.mocked(paymentsApi.getPaymentInstructions).mockResolvedValue({
      currency: "PKR",
      bank_name: "Meezan Digital Centre",
      account_title: "SHAHAN ALI",
      account_number: "00300112202336",
      iban: "PK27MEZN0000300112202336",
      instructions: "Use your order number as the payment reference.",
    });
  });

  it("shows the Veni order number as the bank transfer reference", async () => {
    renderWithProviders(
      <PaymentProofUpload
        orderId={42}
        orderNumber="VENI-00042"
        orderStatus="PENDING_PAYMENT"
        orderTotal="Rs 100.00"
        payment={{
          can_upload_proof: true,
          status: null,
          rejection_reason: "",
          reference_number: "",
          updated_at: null,
        }}
      />
    );

    await waitFor(() =>
      expect(screen.getByText(/meezan digital centre/i)).toBeInTheDocument()
    );
    expect(screen.getByText("SHAHAN ALI")).toBeInTheDocument();
    expect(screen.getByText("00300112202336")).toBeInTheDocument();
    expect(screen.getByText("PK27MEZN0000300112202336")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy account number/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy iban/i })).toBeInTheDocument();
    expect(screen.getByText("VENI-00042")).toBeInTheDocument();
    expect(screen.getByText(/use as your transfer reference/i)).toBeInTheDocument();
  });
});
