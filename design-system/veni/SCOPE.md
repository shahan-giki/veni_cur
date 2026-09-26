# Veni design scope

Veni is a **broad multi-category B2C e-commerce** brand, not a single-vertical shop.

## In scope for visual design

One generic product experience that works equally for:

- Skincare and oral care
- Perfumes and fragrances
- Shawls and textiles
- Peshawari chappals and future footwear
- Any future category added via admin data (clothing, jewelry, electronics, gifts, etc.)

## Out of scope for architecture and UI structure

- Category-specific layouts (`SkincareProduct`, perfume-only landing templates, etc.)
- Marketplace/seller visual language (no seller storefronts)

## Admin

Use `pages/admin-dashboard.md` overrides: dense tables, clear **order/payment status** badges, accessible forms, presigned image preview patterns (implementation Phase 7).

## Status indicators (semantic colors)

Use MASTER destructive/muted/primary consistently:

| State | Usage |
|-------|--------|
| Pending payment / review | accent or muted badge |
| Verified | primary/success tone |
| Rejected | destructive |
| Order fulfillment | neutral + primary progression |

Exact enum labels come from the backend; UI maps statuses to these roles without hardcoding business rules in CSS alone.
