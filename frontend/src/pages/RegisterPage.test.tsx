import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "../api/client";
import * as authApi from "../api/auth";
import { AuthProvider } from "../auth/AuthProvider";
import { RegisterPage } from "./RegisterPage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.mocked(authApi.register).mockReset();
  });

  it("shows validation error from API", async () => {
    vi.mocked(authApi.register).mockRejectedValue(
      new ApiError(400, "/auth/register/", { email: ["A user with this email already exists."] })
    );
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    await user.type(screen.getByLabelText(/^email/i), "dup@veni.test");
    await user.type(screen.getByLabelText(/^password/i), "StrongPass123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
  });
});
