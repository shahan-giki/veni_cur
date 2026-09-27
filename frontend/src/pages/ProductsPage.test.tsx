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
      price_varies: false,
      default_variant_id: 10,
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

  it("submits search from the filters tray to update listing", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ["/products"] } }
    );
    await screen.findByText("Test Serum");
    vi.mocked(catalog.listProducts).mockClear();

    await user.click(screen.getByRole("button", { name: /filters & sort/i }));
    await user.type(await screen.findByLabelText(/^search$/i), "serum");
    await user.click(screen.getByRole("button", { name: /apply search/i }));

    await waitFor(() =>
      expect(catalog.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ q: "serum", page: 1 })
      )
    );
  });

  it("closes the filters tray and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ["/products"] } }
    );
    await screen.findByText("Test Serum");

    const trigger = screen.getByRole("button", { name: /filters & sort/i });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
