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
  listProducts: vi.fn().mockResolvedValue({ count: 0, next: null, previous: null, results: [] }),
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
  price_varies: true,
  default_variant_id: 10,
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
    await user.selectOptions(screen.getByLabelText(/^option$/i), "11");
    expect(screen.getByText(/limited availability/i)).toBeInTheDocument();
  });

  it("injects Product JSON-LD for the selected variant", async () => {
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/products/sample-product"] } }
    );
    expect(await screen.findByRole("heading", { name: "Sample Product" })).toBeInTheDocument();

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const ld = JSON.parse(script!.textContent ?? "{}");
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Sample Product");
    expect(ld.sku).toBe("SKU-A");
    expect(ld.offers.priceCurrency).toBe("PKR");
    expect(ld.offers.price).toBe("500.00");
    expect(ld.offers.availability).toBe("https://schema.org/InStock");
  });

  it("links shipping and payment policies from the deliveries accordion", async () => {
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
    await user.click(screen.getByText(/deliveries & returns/i));
    expect(screen.getByRole("link", { name: /shipping & returns/i })).toHaveAttribute(
      "href",
      "/shipping-returns"
    );
    expect(screen.getByRole("link", { name: /^payment$/i })).toHaveAttribute(
      "href",
      "/payment-info"
    );
  });

  it("renders circular color swatches and switches color", async () => {
    const user = userEvent.setup();
    vi.mocked(catalog.getProduct).mockResolvedValue({
      ...mockProduct,
      variants: [
        {
          id: 10,
          sku: "SHAWL-TAUPE",
          label: "Taupe",
          effective_price: "500.00",
          inventory_count: 12,
          attributes: { color: "Taupe", color_hex: "#8b7355" },
          is_default: true,
        },
        {
          id: 11,
          sku: "SHAWL-NAVY",
          label: "Navy",
          effective_price: "500.00",
          inventory_count: 2,
          attributes: { color: "Navy", color_hex: "#1e3a5f" },
          is_default: false,
        },
      ],
    });
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/products/sample-product"] } }
    );
    expect(await screen.findByRole("heading", { name: "Sample Product" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Taupe" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await user.click(screen.getByRole("radio", { name: "Navy" }));
    expect(screen.getByRole("radio", { name: "Navy" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText(/limited availability/i)).toBeInTheDocument();
  });

  it("shows product description heading", async () => {
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/products/sample-product"] } }
    );
    expect(await screen.findByRole("heading", { name: /product description/i })).toBeInTheDocument();
    expect(screen.getByText("Great product")).toBeInTheDocument();
  });

  it("lists related products from the same category", async () => {
    vi.mocked(catalog.listProducts).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 99,
          name: "Related Serum",
          slug: "related-serum",
          category_slug: "skincare",
          description: "",
          effective_price: "200.00",
          price_varies: false,
          default_variant_id: 1,
          primary_image_url: null,
        },
      ],
    });
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/products/sample-product"] } }
    );
    expect(await screen.findByRole("heading", { name: /you may also like/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /related serum/i })).toHaveAttribute(
      "href",
      "/products/related-serum"
    );
  });
});
