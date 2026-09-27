import { ApiError, fetchJson, getApiBaseUrl, ensureCsrfCookie } from "./client";
import type { LoginPayload, PublicUser, RegisterPayload } from "./types/auth";

export { ensureCsrfCookie };

export async function getCurrentUser(): Promise<PublicUser | null> {
  const response = await fetch(`${getApiBaseUrl()}/auth/me/`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw await ApiError.fromResponse(response, "/auth/me/");
  }
  return response.json() as Promise<PublicUser>;
}

export async function register(payload: RegisterPayload): Promise<PublicUser> {
  await ensureCsrfCookie();
  return fetchJson<PublicUser>("/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<PublicUser> {
  await ensureCsrfCookie();
  return fetchJson<PublicUser>("/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await ensureCsrfCookie();
  await fetchJson<void>("/auth/logout/", { method: "POST" });
}

export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  await ensureCsrfCookie();
  return fetchJson("/auth/password/reset/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(payload: {
  uid: string;
  token: string;
  new_password: string;
}): Promise<{ detail: string }> {
  await ensureCsrfCookie();
  return fetchJson("/auth/password/reset/confirm/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ detail: string }> {
  await ensureCsrfCookie();
  return fetchJson("/auth/password/change/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
