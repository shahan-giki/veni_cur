import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AdminLayout } from "./AdminLayout";
import * as auth from "../../auth/AuthProvider";

vi.mock("../../auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("AdminLayout", () => {
  it("renders sidebar navigation", () => {
    vi.mocked(auth.useAuth).mockReturnValue({
      status: "authenticated",
      user: { id: 1, email: "a@veni.test", role: "ADMIN", first_name: "", last_name: "" },
      isAdmin: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<span>Content</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole("complementary", { name: /admin navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /products/i })).toBeInTheDocument();
  });
});
