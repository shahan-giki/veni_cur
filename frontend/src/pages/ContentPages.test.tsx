import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Routes, Route } from "react-router-dom";
import { CONTACT, POLICY_COUNSEL_NOTICE } from "../content/storefrontPages";
import { renderWithProviders } from "../test/testUtils";
import { ContactPage } from "./ContactPage";
import { PrivacyPage } from "./PrivacyPage";
import { ShippingReturnsPage } from "./ShippingReturnsPage";
import { TermsPage } from "./TermsPage";

describe("ContactPage", () => {
  it("shows contact facts and a mailto link", () => {
    renderWithProviders(<ContactPage />);

    expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CONTACT.email })).toHaveAttribute(
      "href",
      `mailto:${CONTACT.email}`
    );
    expect(screen.getByRole("link", { name: /shipping & returns/i })).toHaveAttribute(
      "href",
      "/shipping-returns"
    );
  });
});

describe("ShippingReturnsPage", () => {
  it("covers shipping, returns, counsel notice, and a path back to contact", () => {
    renderWithProviders(
      <Routes>
        <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ["/shipping-returns"] } }
    );

    expect(screen.getByRole("heading", { name: "Shipping & returns" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Shipping" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Returns" })).toBeInTheDocument();
    expect(screen.getByRole("note", { name: /counsel review notice/i })).toHaveTextContent(
      POLICY_COUNSEL_NOTICE
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
  });
});

describe("policy pages counsel notice", () => {
  it("shows the draft counsel banner on Privacy and Terms", () => {
    renderWithProviders(<PrivacyPage />);
    expect(screen.getByRole("note", { name: /counsel review notice/i })).toBeInTheDocument();
    expect(document.title).toMatch(/Privacy/i);

    renderWithProviders(<TermsPage />);
    expect(screen.getByRole("heading", { name: /product information/i })).toBeInTheDocument();
    expect(screen.getAllByRole("note", { name: /counsel review notice/i }).length).toBeGreaterThan(
      0
    );
  });
});
