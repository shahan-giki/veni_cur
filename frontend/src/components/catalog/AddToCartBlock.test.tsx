import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Routes, Route } from "react-router-dom";
import * as cartApi from "../../api/cart";
import { AuthProvider } from "../../auth/AuthProvider";
import { AddToCartBlock } from "./AddToCartBlock";
import { renderWithProviders } from "../../test/testUtils";

vi.mock("../../api/auth", () => ({
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

vi.mock("../../api/cart", () => ({
  getCart: vi.fn().mockResolvedValue({
    id: 1,
    items: [],
    subtotal: "0",
    item_count: 0,
    line_count: 0,
    updated_at: "",
  }),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

const variant = {
  id: 5,
  sku: "v-sku",
  label: "50ml",
  effective_price: "10.00",
  inventory_count: 3,
  attributes: {},
  is_default: true,
};

describe("AddToCartBlock", () => {
  beforeEach(() => {
    vi.mocked(cartApi.addCartItem).mockResolvedValue({
      id: 1,
      items: [],
      subtotal: "10",
      item_count: 1,
      line_count: 1,
      updated_at: "",
    });
  });

  it("adds to cart when customer is signed in", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <AddToCartBlock productName="Serum" selectedVariant={variant} />
      </AuthProvider>
    );
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(cartApi.addCartItem).toHaveBeenCalledWith(5, 1);
  });

  it("redirects to login when signed out", async () => {
    const auth = await import("../../api/auth");
    vi.mocked(auth.getCurrentUser).mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AddToCartBlock productName="Serum" selectedVariant={variant} />} />
          <Route path="/login" element={<h1>Sign in</h1>} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/"] } }
    );
    await screen.findByRole("button", { name: /add to cart/i });
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });
});
