import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as cartApi from "../../api/cart";
import type { PublicProductListItem } from "../../api/types/catalog";
import { renderWithProviders } from "../../test/testUtils";
import { ProductCard } from "./ProductCard";

vi.mock("../../api/cart", () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

const product: PublicProductListItem = {
  id: 1,
  name: "Test Serum",
  slug: "test-serum",
  category_slug: "skincare",
  description: "A serum",
  effective_price: "999.00",
  price_varies: false,
  default_variant_id: 42,
  primary_image_url: null,
};

describe("ProductCard", () => {
  beforeEach(() => {
    vi.mocked(cartApi.addCartItem).mockResolvedValue({
      id: 1,
      items: [],
      subtotal: "0",
      item_count: 1,
      line_count: 1,
      updated_at: "",
    });
  });

  it("offers Buy now and Add to cart", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductCard product={product} />);

    expect(screen.getByRole("link", { name: /^test serum$/i })).toHaveAttribute(
      "href",
      "/products/test-serum"
    );
    expect(screen.getByRole("link", { name: /buy now/i })).toHaveAttribute(
      "href",
      "/products/test-serum"
    );

    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(cartApi.addCartItem).toHaveBeenCalledWith(42, 1);
    expect(await screen.findByRole("status")).toHaveTextContent(/added to cart/i);
  });
});
