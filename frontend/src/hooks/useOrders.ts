import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkout, getOrder, listOrders } from "../api/orders";
import { cartKeys } from "../app/queryClient";
import { useAuth } from "../auth/AuthProvider";

export const orderKeys = {
  all: ["orders"] as const,
  list: (page: number) => ["orders", "list", page] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
};

export function useOrderList(page = 1) {
  const { user, status } = useAuth();
  const enabled = status === "authenticated" && user?.role === "CUSTOMER";
  return useQuery({
    queryKey: orderKeys.list(page),
    queryFn: () => listOrders(page),
    enabled,
  });
}

export function useOrderDetail(orderId: number) {
  const { user, status } = useAuth();
  const enabled =
    status === "authenticated" && user?.role === "CUSTOMER" && orderId > 0;
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkout,
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.setQueryData(orderKeys.detail(order.id), order);
    },
  });
}
