import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AdminRoute } from "./AdminRoute";
import * as auth from "./AuthProvider";

vi.mock("./AuthProvider", () => ({
  useAuth: vi.fn(),
}));

function renderAdmin(initial = "/admin/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/" element={<h1>Storefront</h1>} />
        <Route path="/login" element={<h1>Login</h1>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<h1>Admin home</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminRoute", () => {
  it("redirects unauthenticated users to login", () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      status: "unauthenticated",
      user: null,
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    renderAdmin();
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("redirects customers to storefront", () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      status: "authenticated",
      user: { id: 1, email: "c@veni.test", role: "CUSTOMER", first_name: "", last_name: "" },
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    renderAdmin();
    expect(screen.getByRole("heading", { name: /storefront/i })).toBeInTheDocument();
  });

  it("allows admin users", () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      status: "authenticated",
      user: { id: 2, email: "a@veni.test", role: "ADMIN", first_name: "", last_name: "" },
      isAdmin: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    renderAdmin();
    expect(screen.getByRole("heading", { name: /admin home/i })).toBeInTheDocument();
  });
});
