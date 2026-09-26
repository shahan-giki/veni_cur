import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const catalogKeys = {
  categories: ["categories"] as const,
  category: (slug: string) => ["categories", slug] as const,
  products: (params: Record<string, string | number | undefined>) =>
    ["products", params] as const,
  product: (slug: string) => ["products", slug] as const,
};

export const cartKeys = {
  all: ["cart"] as const,
};
