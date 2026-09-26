# Product Listing Page Overrides

> **PROJECT:** Veni
> **Generated:** 2026-09-26 14:08:36
> **Page Type:** Product Detail

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/veni/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px (standard)
- **Layout:** Full-width sections, centered content
- **Sections:** Category header or search context > Filter sidebar (desktop) / filter sheet (mobile) > Product grid > Pagination or load more. No seller/marketplace CTAs — single-merchant Veni catalog only.

### Spacing Overrides

- No overrides — use Master spacing

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Search: High contrast. Categories: Visual icons. Trust: Blue/Green.

### Component Overrides

- Avoid: Blank screen or '0 results'
- Avoid: Require full type and enter

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Search: Show "No results" with category suggestions and popular products
- Search: Typeahead predictions where API supports it
- Filters: Chip collection with flex-wrap; never clip overflow filters (see UX guidelines)
- CTA: Add to cart from grid where variants allow; otherwise link to product detail
