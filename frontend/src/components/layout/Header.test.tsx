import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "../../api/auth";
import * as catalog from "../../api/catalog";
import { AuthProvider } from "../../auth/AuthProvider";
import { renderWithProviders } from "../../test/testUtils";
import { Header } from "./Header";

vi.mock("../../api/auth", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}));

vi.mock("../../api/catalog", () => ({
  listCategories: vi.fn(),
  listProducts: vi.fn(),
}));

vi.mock("../../api/cart", () => ({
  getCart: vi.fn().mockResolvedValue({
    id: 1,
    items: [],
    subtotal: "0",
    item_count: 0,
    line_count: 0,
    updated_at: "",
  }),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

function renderHeader() {
  return renderWithProviders(
    <AuthProvider>
      <Header />
    </AuthProvider>
  );
}

function openTray(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole("button", { name: /^menu$/i }));
}

describe("Header", () => {
  beforeEach(() => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);
    vi.mocked(catalog.listCategories).mockResolvedValue([
      { id: 1, name: "Skincare", slug: "skincare", parent: null, parent_slug: null, sort_order: 1 },
    ]);
  });

  it("keeps menu on the left with theme and cart on the right — no top search", async () => {
    renderHeader();

    const menuTrigger = screen.getByRole("button", { name: /^menu$/i });
    expect(menuTrigger.querySelector(".veni-menu-icon")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^search$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /shop all/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /switch to (dark|light) mode/i })
    ).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: /primary/i });
    const controls = nav.querySelectorAll("a, button, form");
    expect(controls[controls.length - 1]).toHaveAttribute("href", "/cart");
  });

  it("opens the tray from the menu with search inside", async () => {
    const user = userEvent.setup();
    renderHeader();

    await openTray(user);

    const dialog = await screen.findByRole("dialog");
    expect(screen.queryByRole("heading", { name: /categories/i })).not.toBeInTheDocument();
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByLabelText(/search products/i)).toBeInTheDocument();
    expect(dialog.querySelector(".tray-search__submit svg")).toBeTruthy();
    expect(dialog.querySelector(".drawer__close")).toBeTruthy();
  });

  it("navigates to the start of all products from the tray", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    renderHeader();

    await openTray(user);
    await user.click(await screen.findByRole("button", { name: /all products/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    scrollTo.mockRestore();
  });

  it("toggles theme with the sun/moon icon only", async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole("button", { name: /switch to dark mode/i });
    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: /switch to light mode/i })
    ).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("only fetches categories once the tray is opened", async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(catalog.listCategories).not.toHaveBeenCalled();

    await openTray(user);

    expect(await screen.findByRole("link", { name: "Skincare" })).toHaveAttribute(
      "href",
      "/categories/skincare"
    );
  });

  it("closes the tray on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    renderHeader();

    const trigger = screen.getByRole("button", { name: /^menu$/i });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
