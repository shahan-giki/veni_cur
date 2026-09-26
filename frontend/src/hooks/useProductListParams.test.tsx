import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useProductListParams } from "./useProductListParams";

function wrapper(initial: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>;
  };
}

function useLocationSearch() {
  const loc = useLocation();
  return loc.search;
}

describe("useProductListParams", () => {
  it("reads q, category, ordering, and page from URL", () => {
    const { result } = renderHook(
      () => ({ params: useProductListParams(), search: useLocationSearch() }),
      { wrapper: wrapper("/products?q=serum&category=skincare&ordering=-base_price&page=2") }
    );
    expect(result.current.params.state.q).toBe("serum");
    expect(result.current.params.state.category).toBe("skincare");
    expect(result.current.params.state.ordering).toBe("-base_price");
    expect(result.current.params.state.page).toBe(2);
  });

  it("patchParams updates search and resets page", () => {
    const { result } = renderHook(() => useProductListParams(), {
      wrapper: wrapper("/products?page=3"),
    });
    act(() => {
      result.current.patchParams({ q: "oil" }, true);
    });
    expect(result.current.state.q).toBe("oil");
    expect(result.current.state.page).toBe(1);
  });
});
