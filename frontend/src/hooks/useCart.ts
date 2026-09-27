import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../api/cart";
import { ApiError } from "../api/client";
import { cartKeys } from "../app/queryClient";

export function useCartQuery() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: getCart,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
  });
}

export function useCartMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: cartKeys.all });

  const addItem = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: number; quantity: number }) =>
      addCartItem(variantId, quantity),
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart),
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: number) => removeCartItem(itemId),
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart),
  });

  const clear = useMutation({
    mutationFn: () => clearCart(),
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart),
  });

  return { addItem, updateItem, removeItem, clear, invalidate };
}
