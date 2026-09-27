/**
 * API client — session cookies + CSRF for unsafe methods (ADR-0001).
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "/api/v1";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function getApiBaseUrl(): string {
  return API_BASE;
}

function readCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function ensureCsrfCookie(): Promise<void> {
  if (readCsrfTokenFromCookie()) return;
  await fetch(`${API_BASE}/auth/csrf/`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly data: unknown;

  constructor(status: number, path: string, data: unknown = undefined) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `API ${status}: ${path}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.data = data;
  }

  static async fromResponse(response: Response, path: string): Promise<ApiError> {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = undefined;
    }
    return new ApiError(response.status, path, data);
  }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (UNSAFE_METHODS.has(method)) {
    const csrf = readCsrfTokenFromCookie();
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    // Must come after `init`: it already merges init.headers, plus Accept and X-CSRFToken.
    headers,
  });
  if (!response.ok) {
    throw await ApiError.fromResponse(response, path);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

/** Collect first validation message from DRF error payloads. */
export function formatApiValidationError(error: unknown): string {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") {
    return error instanceof Error ? error.message : "Something went wrong.";
  }
  const data = error.data as Record<string, unknown>;
  if (typeof data.detail === "string") return data.detail;
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }
  return "Please check your input and try again.";
}
