import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Routes, Route } from "react-router-dom";
import * as catalog from "../api/catalog";
import { ProductsPage } from "./ProductsPage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/catalog", () => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
}));

const mockCategories = [
  {
    id: 1,
    name: "Skincare",
    slug: "skincare",
    parent: null,
    parent_slug: null,
    sort_order: 1,
  },
];

const mockProducts = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      name: "Test Serum",
      slug: "test-serum",
      category_slug: "skincare",
      description: "A serum",
      effective_price: "999.00",
      primary_image_url: null,
    },
  ],
};

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.mocked(catalog.listCategories).mockResolvedValue(mockCategories);
    vi.mocked(catalog.listProducts).mockResolvedValue(mockProducts);
  });

  it("renders products from API", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ["/products"] } }
    );
    expect(await screen.findByText("Test Serum")).toBeInTheDocument();
  });

  it("submits search to update listing", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ["/products"] } }
    );
    await screen.findByText("Test Serum");
    vi.mocked(catalog.listProducts).mockClear();
    await user.type(screen.getByLabelText(/search products/i), "serum");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() =>
      expect(catalog.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ q: "serum", page: 1 })
      )
    );
  });
});
