import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Routes, Route } from "react-router-dom";
import * as authApi from "../api/auth";
import * as cartApi from "../api/cart";
import * as ordersApi from "../api/orders";
import { AuthProvider } from "../auth/AuthProvider";
import { CheckoutPage } from "./CheckoutPage";
import { renderWithProviders } from "../test/testUtils";

vi.mock("../api/auth", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}));

vi.mock("../api/cart", () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock("../api/orders", () => ({
  checkout: vi.fn(),
  guestCheckout: vi.fn(),
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  getOrderByToken: vi.fn(),
}));

const cartWithItem = {
  id: 1,
  items: [
    {
      id: 10,
      variant_id: 1,
      product_id: 1,
      product_name: "Serum",
      product_slug: "serum",
      variant_label: "Default",
      variant_attributes: {},
      sku: "s1",
      inventory_count: 5,
      unit_price: "29.99",
      quantity: 1,
      line_total: "29.99",
      primary_image_url: null,
    },
  ],
  subtotal: "29.99",
  item_count: 1,
  line_count: 1,
  updated_at: "2026-01-01T00:00:00Z",
};

const contact = {
  name: "Ayesha Khan",
  phone: "+92 300 1234567",
  email: "c@veni.test",
  address: "12 Jinnah Road",
  city: "Lahore",
};

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.mocked(cartApi.getCart).mockResolvedValue(cartWithItem);
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: 1,
      email: "c@veni.test",
      role: "CUSTOMER",
      first_name: "Ayesha",
      last_name: "Khan",
    });
    vi.mocked(ordersApi.checkout).mockReset();
    vi.mocked(ordersApi.guestCheckout).mockReset();
  });

  it("loads cart summary and places order with contact details", async () => {
    vi.mocked(ordersApi.checkout).mockResolvedValue({
      id: 99,
      status: "PENDING_PAYMENT",
      payment_method: "MANUAL_TRANSFER",
      subtotal: "29.99",
      total: "29.99",
      item_count: 1,
      payment_status: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      access_token: "00000000-0000-0000-0000-000000000099",
      payment: {
        status: null,
        can_upload_proof: true,
        rejection_reason: "",
        reference_number: "",
        updated_at: null,
      },
      items: cartWithItem.items.map((i) => ({
        id: 1,
        product_name_snapshot: i.product_name,
        variant_label_snapshot: i.variant_label,
        variant_attributes_snapshot: {},
        sku_snapshot: i.sku,
        unit_price: i.unit_price,
        quantity: i.quantity,
        line_total: i.line_total,
      })),
    });
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account/orders/:id" element={<h1>Order placed</h1>} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/checkout"] } }
    );
    expect(await screen.findByText("Serum")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/full name/i));
    await user.type(screen.getByLabelText(/full name/i), contact.name);
    await user.clear(screen.getByLabelText(/^phone/i));
    await user.type(screen.getByLabelText(/^phone/i), contact.phone);
    await user.clear(screen.getByLabelText(/^email/i));
    await user.type(screen.getByLabelText(/^email/i), contact.email);
    await user.clear(screen.getByLabelText(/^address/i));
    await user.type(screen.getByLabelText(/^address/i), contact.address);
    await user.clear(screen.getByLabelText(/^city/i));
    await user.type(screen.getByLabelText(/^city/i), contact.city);
    await user.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() =>
      expect(ordersApi.checkout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          address: contact.address,
          city: contact.city,
          payment_method: "MANUAL_TRANSFER",
        })
      )
    );
    expect(await screen.findByRole("heading", { name: /order placed/i })).toBeInTheDocument();
  });

  it("places a guest order and navigates to the token order page", async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);
    const accessToken = "11111111-1111-1111-1111-111111111111";
    vi.mocked(ordersApi.guestCheckout).mockResolvedValue({
      id: 77,
      status: "PENDING_PAYMENT",
      payment_method: "MANUAL_TRANSFER",
      subtotal: "29.99",
      total: "29.99",
      item_count: 1,
      payment_status: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      access_token: accessToken,
      payment: {
        status: null,
        can_upload_proof: true,
        rejection_reason: "",
        reference_number: "",
        updated_at: null,
      },
      items: [],
    });
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/orders/guest/:accessToken"
            element={<h1>Guest order page</h1>}
          />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/checkout"] } }
    );
    expect(await screen.findByText("Serum")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/full name/i), contact.name);
    await user.type(screen.getByLabelText(/^phone/i), contact.phone);
    await user.type(screen.getByLabelText(/^email/i), contact.email);
    await user.type(screen.getByLabelText(/^address/i), contact.address);
    await user.type(screen.getByLabelText(/^city/i), contact.city);
    await user.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() =>
      expect(ordersApi.guestCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: contact.name,
          email: contact.email,
          payment_method: "MANUAL_TRANSFER",
        })
      )
    );
    expect(ordersApi.checkout).not.toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: /guest order page/i })).toBeInTheDocument();
  });

  it("places a cash on delivery order when COD is selected", async () => {
    vi.mocked(ordersApi.checkout).mockResolvedValue({
      id: 100,
      status: "PROCESSING",
      payment_method: "CASH_ON_DELIVERY",
      subtotal: "29.99",
      total: "29.99",
      item_count: 1,
      payment_status: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      payment: {
        status: null,
        can_upload_proof: false,
        rejection_reason: "",
        reference_number: "",
        updated_at: null,
      },
      items: [],
    });
    const user = userEvent.setup();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account/orders/:id" element={<h1>Order placed</h1>} />
        </Routes>
      </AuthProvider>,
      { routerProps: { initialEntries: ["/checkout"] } }
    );
    expect(await screen.findByText("Serum")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/full name/i));
    await user.type(screen.getByLabelText(/full name/i), contact.name);
    await user.clear(screen.getByLabelText(/^phone/i));
    await user.type(screen.getByLabelText(/^phone/i), contact.phone);
    await user.clear(screen.getByLabelText(/^email/i));
    await user.type(screen.getByLabelText(/^email/i), contact.email);
    await user.clear(screen.getByLabelText(/^address/i));
    await user.type(screen.getByLabelText(/^address/i), contact.address);
    await user.clear(screen.getByLabelText(/^city/i));
    await user.type(screen.getByLabelText(/^city/i), contact.city);
    await user.click(screen.getByRole("radio", { name: /cash on delivery/i }));
    await user.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() =>
      expect(ordersApi.checkout).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: "CASH_ON_DELIVERY" })
      )
    );
  });
});
