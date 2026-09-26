import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import * as ordersApi from "../api/orders";
import * as paymentsApi from "../api/payments";
import { AuthProvider } from "../auth/AuthProvider";
import { OrderDetailPage } from "./OrderDetailPage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 1,
    email: "c@veni.test",
    role: "CUSTOMER",
    first_name: "",
    last_name: "",
  }),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}));

vi.mock("../api/orders", () => ({
  checkout: vi.fn(),
  listOrders: vi.fn(),
  getOrder: vi.fn(),
}));

vi.mock("../api/payments", () => ({
  getPaymentInstructions: vi.fn(),
  presignPaymentProof: vi.fn(),
  confirmPaymentProof: vi.fn(),
  uploadProofToS3: vi.fn(),
}));

const baseOrder = {
  id: 42,
  subtotal: "100.00",
  total: "100.00",
  item_count: 1,
  payment_status: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  items: [
    {
      id: 1,
      product_name_snapshot: "Serum",
      variant_label_snapshot: "Default",
      variant_attributes_snapshot: {},
      sku_snapshot: "s1",
      unit_price: "100.00",
      quantity: 1,
      line_total: "100.00",
    },
  ],
  payment: {
    can_upload_proof: true,
    status: null,
    rejection_reason: "",
    reference_number: "",
    updated_at: null,
  },
};

describe("OrderDetailPage", () => {
  beforeEach(() => {
    vi.mocked(paymentsApi.getPaymentInstructions).mockResolvedValue({
      currency: "PKR",
      bank_name: "Habib Bank Limited",
      account_title: "Veni (Pvt) Ltd",
      account_number: "01234567890123",
      iban: "PK00HABB0000123456789012",
      instructions: "Use your order number as reference.",
    });
  });

  it("shows upload form when pending payment", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      ...baseOrder,
      status: "PENDING_PAYMENT",
    });
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/account/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/account/orders/42"] } }
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /order #42/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /submit payment proof/i })).toBeInTheDocument();
    expect(await screen.findByText(/habib bank limited/i)).toBeInTheDocument();
  });

  it("shows verification badge when payment verification", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      ...baseOrder,
      status: "PAYMENT_VERIFICATION",
      payment_status: "PENDING",
      payment: {
        can_upload_proof: false,
        status: "PENDING",
        rejection_reason: "",
        reference_number: "TXN-1",
        updated_at: "2026-01-01T00:00:00Z",
      },
    });
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/account/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/account/orders/42"] } }
    );
    await waitFor(() =>
      expect(screen.getByText(/payment is being verified/i)).toBeInTheDocument()
    );
    expect(
      screen.queryByRole("button", { name: /submit payment proof/i })
    ).not.toBeInTheDocument();
  });

  it("shows rejection reason after reject", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      ...baseOrder,
      status: "PENDING_PAYMENT",
      payment: {
        can_upload_proof: true,
        status: "REJECTED",
        rejection_reason: "Screenshot is blurry",
        reference_number: "",
        updated_at: "2026-01-01T00:00:00Z",
      },
    });
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/account/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/account/orders/42"] } }
    );
    await waitFor(() =>
      expect(screen.getByText(/screenshot is blurry/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /submit payment proof/i })).toBeInTheDocument();
  });
});
