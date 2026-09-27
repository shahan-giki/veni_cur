import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login } from "./auth";
import { fetchJson } from "./client";

const CSRF_TOKEN = "test-csrf-token-123";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function headersOfLastCall(mock: { mock: { calls: unknown[][] } }): Headers {
  const init = mock.mock.calls.at(-1)?.[1] as RequestInit | undefined;
  return new Headers(init?.headers);
}

describe("fetchJson", () => {
  beforeEach(() => {
    document.cookie = `csrftoken=${CSRF_TOKEN}`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  it("sends the CSRF token alongside a caller-supplied Content-Type", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: 1 }));

    await login({ email: "shopper@veni.test", password: "pw" });

    const headers = headersOfLastCall(fetchMock);
    expect(headers.get("X-CSRFToken")).toBe(CSRF_TOKEN);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("omits the CSRF token on safe methods", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

    await fetchJson("/products/");

    expect(headersOfLastCall(fetchMock).has("X-CSRFToken")).toBe(false);
  });
});
