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
    vi.mocked(catalog.listCategories).mockResolvedValue([
      {
        id: 1,
        name: "Skincare",
        slug: "skincare",
        parent: null,
        parent_slug: null,
        sort_order: 1,
      },
    ]);
    vi.mocked(catalog.listProducts).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
  });

  it("loads categories from API for discovery tiles", async () => {
    renderWithProviders(<HomePage />);
    expect(await screen.findByRole("link", { name: "Skincare" })).toHaveAttribute(
      "href",
      "/categories/skincare"
    );
  });
});
