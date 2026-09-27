# Shipping & Returns Page Overrides

> **PROJECT:** Veni
> **Page Type:** Content / Policy

> Rules here **override** `design-system/veni/MASTER.md`.

---

## Page-Specific Rules

### Layout Overrides

- **Max width:** `40rem` centred (`.content-page`), same shell as Contact.
- **Sections:** Header > Shipping > Returns > Exchanges > Need help (link to Contact).
- One job per section: heading via `.section__title`, then short paragraphs. No FAQ accordion, no icon grid.

### Typography Overrides

- Same as Contact: Jost throughout; no Bodoni; no Title Case Every Word.

### Color Overrides

- No accent gold. Body ink on paper; section rules via border tokens.

### Copy

- Source text lives in `frontend/src/content/storefrontPages.ts`. Keep brand voice: plain, concrete, candid about manual payment verification before shipping.
