# Product Detail Page Overrides

> **PROJECT:** Veni
> **Page Type:** Product detail

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/veni/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Purchase row (desktop):** Two columns — tall gallery left, purchase details right.
- **Purchase row (mobile):** Stacked — full-bleed tall gallery (~60–70vh) on top, then details (Outfitters pattern).
- **Gallery:** Horizontal scroll-snap carousel with pill pagination dots. No thumbnail strip.
- **Below purchase:** Full-width info stack — Product description, disclosure accordions, You may also like.
- **No breadcrumb.**

### Spacing Overrides

- Mobile gallery height: `min(68vh, 32rem)` so the image dominates the first viewport without trapping the CTA forever.

### Typography Overrides

- Section titles (`Product description`, `You may also like`, accordion summaries): uppercase Jost, ~0.7–0.75rem, tracking-wider, weight 500.
- Meta line under price: muted, ~0.75rem (attribute · category).

### Color Overrides

- No overrides — use Master palette (near-black CTA, soft `--radius-btn` on Add to cart).

### Component Overrides

- `ProductGallery`: scroll-snap track; tall hero plane; dot pagination for remaining images.
- `AddToCartBlock`: full-width primary Add to cart with bag icon; Buy now as secondary ghost.
- Accordions: native `<details>` / `<summary>` with `+` affordance (accessible disclosure).

---

## Recommendations

- CTA sits immediately under price/variants in the buy column.
- Prefer real product photography; placeholder is temporary for empty catalogs.
