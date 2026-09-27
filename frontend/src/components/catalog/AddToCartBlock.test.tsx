import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route, Routes, useLocation } from "react-router-dom";
import * as cartApi from "../../api/cart";
import { AuthProvider } from "../../auth/AuthProvider";
import { AddToCartBlock } from "./AddToCartBlock";
import { renderWithProviders } from "../../test/testUtils";

function PathProbe() {
  const loc = useLocation();
  return <div data-testid="path">{loc.pathname}</div>;
}

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

  it("adds to cart without requiring a signed-in Customer", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <AddToCartBlock productName="Serum" selectedVariant={variant} />
      </AuthProvider>
    );
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(cartApi.addCartItem).toHaveBeenCalledWith(5, 1);
  });

  it("buy now adds to cart then goes to checkout", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <AddToCartBlock productName="Serum" selectedVariant={variant} />
                <PathProbe />
              </>
            }
          />
          <Route path="/checkout" element={<PathProbe />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/"] } }
    );
    await user.click(screen.getByRole("button", { name: /buy now/i }));
    expect(cartApi.addCartItem).toHaveBeenCalledWith(5, 1);
    expect(await screen.findByTestId("path")).toHaveTextContent("/checkout");
  });

  it("adds to cart when signed out", async () => {
    const auth = await import("../../api/auth");
    vi.mocked(auth.getCurrentUser).mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <AddToCartBlock productName="Serum" selectedVariant={variant} />
      </AuthProvider>
    );
    await screen.findByRole("button", { name: /add to cart/i });
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(cartApi.addCartItem).toHaveBeenCalledWith(5, 1);
  });
});
