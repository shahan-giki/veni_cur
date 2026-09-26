import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as cartApi from "../api/cart";
import { AuthProvider } from "../auth/AuthProvider";
import { CartPage } from "./CartPage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 1,
    email: "c@veni.test",
    first_name: "C",
    last_name: "User",
    role: "CUSTOMER",
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

const emptyCart = {
  id: 1,
  items: [],
  subtotal: "0.00",
  item_count: 0,
  line_count: 0,
  updated_at: "2026-01-01T00:00:00Z",
};

describe("CartPage", () => {
  beforeEach(() => {
    vi.mocked(cartApi.getCart).mockResolvedValue(emptyCart);
  });

  it("shows empty cart state", async () => {
    renderWithProviders(
      <AuthProvider>
        <CartPage />
      </AuthProvider>
    );
    await waitFor(() =>
      expect(cartApi.getCart).toHaveBeenCalled()
    );
    expect(await screen.findByRole("heading", { name: /your cart is empty/i })).toBeInTheDocument();
  });

  it("shows populated cart", async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue({
      ...emptyCart,
      item_count: 2,
      line_count: 1,
      subtotal: "59.98",
      items: [
        {
          id: 10,
          variant_id: 1,
          product_id: 1,
          product_name: "Test Serum",
          product_slug: "test-serum",
          variant_label: "Default",
          variant_attributes: {},
          sku: "sku-1",
          inventory_count: 5,
          unit_price: "29.99",
          quantity: 2,
          line_total: "59.98",
          primary_image_url: null,
        },
      ],
    });
    renderWithProviders(
      <AuthProvider>
        <CartPage />
      </AuthProvider>
    );
    expect(await screen.findByRole("heading", { name: /^your cart$/i })).toBeInTheDocument();
    expect(screen.getByText("Test Serum")).toBeInTheDocument();
  });
});
