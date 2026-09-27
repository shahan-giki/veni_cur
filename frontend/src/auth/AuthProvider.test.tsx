import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import * as authApi from "../api/auth";
import { AuthProvider } from "./AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import { AccountPage } from "../pages/AccountPage";
import { LoginPage } from "../pages/LoginPage";
import { renderWithProviders } from "../test/testUtils";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

vi.mock("../api/auth", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}));

const mockUser = {
  id: 1,
  email: "user@veni.test",
  first_name: "Test",
  last_name: "User",
  role: "CUSTOMER" as const,
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);
  });

  it("redirects unauthenticated users from account to login", async () => {
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/account"] } }
    );
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows account when authenticated", async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/account"] } }
    );
    expect(await screen.findByRole("heading", { name: /your account/i })).toBeInTheDocument();
    expect(screen.getByText("user@veni.test")).toBeInTheDocument();
  });

  it("header shows no sign in; auth lives in footer", async () => {
    renderWithProviders(
      <AuthProvider>
        <Header />
        <Footer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("navigation", { name: /primary/i })!.querySelector('a[href="/login"]')
    ).toBeNull();
    expect(await screen.findByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });

  it("login success calls API", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue(mockUser);
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);

    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/login"] } }
    );

    await user.type(screen.getByLabelText(/^email/i), "user@veni.test");
    await user.type(screen.getByLabelText(/^password/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(authApi.login).toHaveBeenCalled());
  });
});
