import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/testUtils";
import { ProductGallery } from "./ProductGallery";

const images = [
  { id: 1, alt_text: "Front view", sort_order: 0, url: "https://example.com/a.jpg" },
  { id: 2, alt_text: "Side view", sort_order: 1, url: "https://example.com/b.jpg" },
  { id: 3, alt_text: "Detail view", sort_order: 2, url: "https://example.com/c.jpg" },
  { id: 4, alt_text: "Back view", sort_order: 3, url: "https://example.com/d.jpg" },
  { id: 5, alt_text: "Extra view", sort_order: 4, url: "https://example.com/e.jpg" },
];

describe("ProductGallery", () => {
  it("shows a scrollable track of at least four images with dot pagination and no thumbnail tiles", () => {
    renderWithProviders(<ProductGallery images={images} productName="Serum" />);

    const region = screen.getByRole("region", { name: /serum images/i });
    expect(region.querySelector(".gallery__track")).toBeTruthy();
    expect(region.querySelectorAll(".gallery__slide")).toHaveLength(5);
    expect(screen.getByRole("img", { name: "Front view" })).toHaveAttribute(
      "src",
      "https://example.com/a.jpg"
    );
    expect(screen.getByRole("img", { name: "Back view" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: /product images/i })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(document.querySelector(".gallery__thumbs")).toBeNull();
    expect(document.querySelector(".gallery__thumb")).toBeNull();
  });

  it("shows a placeholder when there are no image URLs", () => {
    renderWithProviders(
      <ProductGallery
        images={[{ id: 1, alt_text: "", sort_order: 0, url: null }]}
        productName="Serum"
      />
    );

    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
