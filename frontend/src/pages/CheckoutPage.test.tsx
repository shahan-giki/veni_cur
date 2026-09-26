import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Routes, Route } from "react-router-dom";
import * as cartApi from "../api/cart";
import * as ordersApi from "../api/orders";
import { AuthProvider } from "../auth/AuthProvider";
import { CheckoutPage } from "./CheckoutPage";
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

vi.mock("../api/cart", () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock("../api/orders", () => ({
  checkout: vi.fn(),
  listOrders: vi.fn(),
  getOrder: vi.fn(),
}));

const cartWithItem = {
  id: 1,
  items: [
    {
      id: 10,
      variant_id: 1,
      product_id: 1,
      product_name: "Serum",
      product_slug: "serum",
      variant_label: "Default",
      variant_attributes: {},
      sku: "s1",
      inventory_count: 5,
      unit_price: "29.99",
      quantity: 1,
      line_total: "29.99",
      primary_image_url: null,
    },
  ],
  subtotal: "29.99",
  item_count: 1,
  line_count: 1,
  updated_at: "2026-01-01T00:00:00Z",
};

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartWithItem);
  });

  it("loads cart summary and places order", async () => {
    vi.mocked(ordersApi.checkout).mockResolvedValue({
      id: 99,
      status: "PENDING_PAYMENT",
      subtotal: "29.99",
      total: "29.99",
      item_count: 1,
      payment_status: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment: {
        status: null,
        can_upload_proof: true,
        rejection_reason: "",
        reference_number: "",
        updated_at: null,
      },
      items: cartWithItem.items.map((i) => ({
        id: 1,
        product_name_snapshot: i.product_name,
        variant_label_snapshot: i.variant_label,
        variant_attributes_snapshot: {},
        sku_snapshot: i.sku,
        unit_price: i.unit_price,
        quantity: i.quantity,
        line_total: i.line_total,
      })),
    });
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account/orders/:id" element={<h1>Order placed</h1>} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/checkout"] } }
    );
    expect(await screen.findByText("Serum")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => expect(ordersApi.checkout).toHaveBeenCalled());
    expect(await screen.findByRole("heading", { name: /order placed/i })).toBeInTheDocument();
  });
});
