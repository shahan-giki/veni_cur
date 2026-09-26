import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { isProductOrdering, type ProductOrdering } from "../constants/productOrdering";

export type ProductListUrlState = {
  q: string;
  category: string;
  ordering: ProductOrdering;
  page: number;
};

const DEFAULT_ORDERING: ProductOrdering = "name";

export function useProductListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo((): ProductListUrlState => {
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? "";
    const orderingRaw = searchParams.get("ordering") ?? DEFAULT_ORDERING;
    const ordering = isProductOrdering(orderingRaw) ? orderingRaw : DEFAULT_ORDERING;
    const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    return { q, category, ordering, page };
  }, [searchParams]);

  const patchParams = useCallback(
    (patch: Partial<ProductListUrlState>, resetPage = false) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const q = patch.q !== undefined ? patch.q : (prev.get("q") ?? "");
        const category =
          patch.category !== undefined ? patch.category : (prev.get("category") ?? "");
        const orderingRaw =
          patch.ordering !== undefined
            ? patch.ordering
            : (prev.get("ordering") ?? DEFAULT_ORDERING);
        const ordering = isProductOrdering(orderingRaw) ? orderingRaw : DEFAULT_ORDERING;
        let page =
          patch.page !== undefined
            ? patch.page
            : Number.parseInt(prev.get("page") ?? "1", 10);
        if (resetPage) page = 1;
        if (!Number.isFinite(page) || page < 1) page = 1;

        if (q) next.set("q", q);
        else next.delete("q");

        if (category) next.set("category", category);
        else next.delete("category");

        if (ordering !== DEFAULT_ORDERING) next.set("ordering", ordering);
        else next.delete("ordering");

        if (page > 1) next.set("page", String(page));
        else next.delete("page");

        return next;
      });
    },
    [setSearchParams]
  );

  return { state, patchParams };
}
