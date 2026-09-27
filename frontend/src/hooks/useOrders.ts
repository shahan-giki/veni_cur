import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkout,
  getOrder,
  getOrderByToken,
  guestCheckout,
  listOrders,
} from "../api/orders";
import type { CheckoutContact } from "../api/types/order";
import { cartKeys } from "../app/queryClient";
import { useAuth } from "../auth/AuthProvider";

export const orderKeys = {
  all: ["orders"] as const,
  list: (page: number) => ["orders", "list", page] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
  byToken: (token: string) => ["orders", "token", token] as const,
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

export function useGuestOrder(accessToken: string) {
  const enabled = Boolean(accessToken);
  return useQuery({
    queryKey: orderKeys.byToken(accessToken),
    queryFn: () => getOrderByToken(accessToken),
    enabled,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  const { status, user } = useAuth();
  const isCustomer =
    status === "authenticated" && user?.role === "CUSTOMER";

  return useMutation({
    mutationFn: (contact: CheckoutContact) =>
      isCustomer ? checkout(contact) : guestCheckout(contact),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      if (order.access_token) {
        queryClient.setQueryData(orderKeys.byToken(order.access_token), order);
      }
    },
  });
}
