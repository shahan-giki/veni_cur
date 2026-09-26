import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Routes, Route } from "react-router-dom";
import * as catalog from "../api/catalog";
import { AuthProvider } from "../auth/AuthProvider";
import { ProductDetailPage } from "./ProductDetailPage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/catalog", () => ({
  getProduct: vi.fn(),
}));

vi.mock("../api/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
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

const mockProduct = {
  id: 1,
  name: "Sample Product",
  slug: "sample-product",
  category_slug: "skincare",
  description: "Great product",
  effective_price: "500.00",
  primary_image_url: null,
  images: [{ id: 1, alt_text: "Front view", sort_order: 0, url: "https://example.com/a.jpg" }],
  variants: [
    {
      id: 10,
      sku: "SKU-A",
      label: "50ml",
      effective_price: "500.00",
      inventory_count: 12,
      attributes: { volume: "50ml" },
      is_default: true,
    },
    {
      id: 11,
      sku: "SKU-B",
      label: "100ml",
      effective_price: "900.00",
      inventory_count: 2,
      attributes: { volume: "100ml" },
      is_default: false,
    },
  ],
};

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.mocked(catalog.getProduct).mockResolvedValue(mockProduct);
  });

  it("renders product and switches variant", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/products/sample-product"] } }
    );
    expect(await screen.findByRole("heading", { name: "Sample Product" })).toBeInTheDocument();
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "100ml" }));
    expect(screen.getByText(/limited availability/i)).toBeInTheDocument();
  });
});
