import { screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as catalog from "../api/catalog";
import { HomePage } from "./HomePage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/catalog", () => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(catalog.listProducts).mockResolvedValue({
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
    });
  });

  it("leads with featured products", async () => {
    renderWithProviders(<HomePage />);
    expect(await screen.findByRole("link", { name: /Test Serum/ })).toHaveAttribute(
      "href",
      "/products/test-serum"
    );
    expect(screen.queryByRole("heading", { name: /authentic products/i })).not.toBeInTheDocument();
  });

  it("does not fetch categories: they live in the header tray", async () => {
    renderWithProviders(<HomePage />);
    await screen.findByRole("link", { name: /Test Serum/ });
    expect(catalog.listCategories).not.toHaveBeenCalled();
  });
});
