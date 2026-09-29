import { screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as catalog from "../api/catalog";
import { buildHomeCollections, HomePage } from "./HomePage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/catalog", () => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
}));

describe("buildHomeCollections", () => {
  it("includes all top-level categories and marks empty ones", () => {
    const result = buildHomeCollections(
      [
        {
          id: 1,
          name: "Skincare",
          slug: "skincare",
          parent: null,
          parent_slug: null,
          sort_order: 10,
        },
        {
          id: 2,
          name: "Empty",
          slug: "empty",
          parent: null,
          parent_slug: null,
          sort_order: 20,
        },
      ],
      [
        {
          id: 1,
          name: "Serum",
          slug: "serum",
          category_slug: "skincare",
          description: "",
          effective_price: "1",
          price_varies: false,
          default_variant_id: 1,
          primary_image_url: null,
        },
      ]
    );
    expect(result.map((c) => [c.category.slug, c.isEmpty])).toEqual([
      ["skincare", false],
      ["empty", true],
    ]);
  });
});

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
    vi.mocked(catalog.listCategories).mockResolvedValue([
      {
        id: 1,
        name: "Skincare",
        slug: "skincare",
        parent: null,
        parent_slug: null,
        sort_order: 10,
      },
      {
        id: 2,
        name: "Empty Category",
        slug: "empty-category",
        parent: null,
        parent_slug: null,
        sort_order: 20,
      },
    ]);
  });

  it("leads with featured products", async () => {
    renderWithProviders(<HomePage />);
    const productLinks = await screen.findAllByRole("link", { name: /Test Serum/ });
    expect(productLinks[0]).toHaveAttribute("href", "/products/test-serum");
    expect(screen.queryByRole("heading", { name: /authentic products/i })).not.toBeInTheDocument();
  });

  it("shows all collections and marks empty ones", async () => {
    renderWithProviders(<HomePage />);
    expect(await screen.findByRole("heading", { name: /^collections$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skincare/i })).toHaveAttribute(
      "href",
      "/products?category=skincare"
    );
    expect(screen.getByLabelText(/empty category, empty/i)).toBeInTheDocument();
    expect(screen.getByText(/^empty$/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /scroll collections/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/01\s*\/\s*02/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view all products/i })).toHaveClass("home-more-link");
  });
});
