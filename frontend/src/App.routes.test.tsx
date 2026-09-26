import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import App from "./App";
import * as catalog from "./api/catalog";

vi.mock("./api/catalog", () => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
  getCategory: vi.fn(),
  getProduct: vi.fn(),
}));

describe("App routing", () => {
  beforeEach(() => {
    vi.mocked(catalog.listCategories).mockResolvedValue([]);
    vi.mocked(catalog.listProducts).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
  });

  it("renders homepage at /", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    expect(await screen.findByRole("heading", { name: /shop veni/i })).toBeInTheDocument();
  });
});
