import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import * as ordersApi from "../../api/admin/orders";
import * as paymentsApi from "../../api/admin/payments";
import { AdminOrderDetailPage } from "./AdminOrderDetailPage";
import { renderWithProviders } from "../../test/testUtils";

vi.mock("../../api/admin/orders", () => ({
  getAdminOrder: vi.fn(),
  patchAdminOrderStatus: vi.fn(),
}));

vi.mock("../../api/admin/payments", () => ({
  getAdminPaymentProof: vi.fn(),
  verifyAdminPayment: vi.fn(),
  rejectAdminPayment: vi.fn(),
}));

const orderWithPendingPayment = {
  id: 7,
  status: "PAYMENT_VERIFICATION",
  customer_email: "c@veni.test",
  subtotal: "50.00",
  total: "50.00",
  item_count: 1,
  pending_payment_id: 99,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  customer: { id: 1, email: "c@veni.test", first_name: "C", last_name: "User" },
  items: [
    {
      id: 1,
      product_name_snapshot: "Serum",
      variant_label_snapshot: "Default",
      sku_snapshot: "s1",
      unit_price: "50.00",
      quantity: 1,
      line_total: "50.00",
    },
  ],
  payments: [
    {
      id: 99,
      status: "PENDING",
      amount: "50.00",
      reference_number: "TXN-1",
      rejection_reason: "",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
};

describe("AdminOrderDetailPage", () => {
  beforeEach(() => {
    vi.mocked(ordersApi.getAdminOrder).mockResolvedValue(orderWithPendingPayment);
    vi.mocked(paymentsApi.getAdminPaymentProof).mockResolvedValue({
      url: "https://fake-s3.test/proof.png",
      expires_in: 900,
    });
  });

  it("renders proof and verify/reject controls", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ["/admin/orders/7"] } }
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /order #7/i })).toBeInTheDocument()
    );
    expect(await screen.findByRole("img", { name: /payment proof/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify payment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject payment/i })).toBeInTheDocument();
  });
});
