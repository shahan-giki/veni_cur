import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { getCurrentUser, login as loginApi, logout as logoutApi, register as registerApi } from "../api/auth";
import { cartKeys } from "../app/queryClient";
import type { LoginPayload, PublicUser, RegisterPayload } from "../api/types/auth";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: PublicUser | null;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<PublicUser>;
  register: (payload: RegisterPayload) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const authQueryKey = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
  });

  const setUser = useCallback(
    (user: PublicUser | null) => {
      queryClient.setQueryData(authQueryKey, user);
    },
    [queryClient]
  );

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (user) => {
      setUser(user);
      if (user.role === "CUSTOMER") {
        void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      setUser(null);
      queryClient.removeQueries({ queryKey: cartKeys.all });
    },
  });

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: authQueryKey });
  }, [queryClient]);

  const status: AuthStatus = meQuery.isLoading
    ? "loading"
    : meQuery.data
      ? "authenticated"
      : "unauthenticated";

  const value = useMemo(
    (): AuthContextValue => ({
      status,
      user: meQuery.data ?? null,
      isAdmin: meQuery.data?.role === "ADMIN",
      login: (payload) => loginMutation.mutateAsync(payload),
      register: (payload) => registerMutation.mutateAsync(payload),
      logout: () => logoutMutation.mutateAsync(),
      refreshUser,
    }),
    [status, meQuery.data, loginMutation, registerMutation, logoutMutation, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
