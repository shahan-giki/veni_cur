# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/veni/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Veni
**Category:** E-commerce (luxury apparel & lifestyle)
**Art direction:** Minimalist heritage fashion — the Levi's / Louis Vuitton register
**Design Dials:** Variance 2/10 (Centered / Minimal) | Motion 3/10 (Subtle) | Density 4/10 (Standard)

Generated from:

```bash
python .cursor/skills/ui-ux-pro-max/scripts/search.py "luxury fashion apparel minimal editorial" \
  --design-system --variance 2 --motion 3 --density 4 -p "Veni"
```

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1C1917` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#44403C` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#A16207` | `--color-accent` |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |
| Background | `#FAFAF9` | `--color-background` |
| Foreground | `#0C0A09` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#0C0A09` | `--color-card-foreground` |
| Muted | `#F5F5F4` | `--color-muted` |
| Muted Foreground | `#57534E` | `--color-muted-foreground` |
| Border | `#D6D3D1` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#1C1917` | `--color-ring` |

**Color Notes:** Premium dark + gold accent [Accent adjusted from `#CA8A04`].

Two deliberate deviations from the generated palette, both documented rather than silent:

- **Muted and Muted Foreground use the warm stone ramp** (`#F5F5F4` / `#57534E`) instead of the generated cool slate (`#E8ECF0` / `#475569`). The rest of the palette is warm-neutral; cool grey reads as a different brand sitting inside the same page.
- **The primary CTA is near-black, not gold.** Both reference brands drive action with black-on-white; gold is reserved for small emphasis (sale, limited availability, admin attention states). Measured contrast: white on `#1C1917` is **17.4:1**; white on `#A16207` is **4.88:1**; `#A16207` text on `#FAFAF9` is **4.68:1**. All three clear WCAG AA for normal text.

### Typography

- **Display Font:** Bodoni Moda — hero headline only
- **Heading & Body Font:** Jost
- **Mood:** luxury, minimalist, high-end, sophisticated, refined, premium
- **Google Fonts:** [Bodoni Moda + Jost](https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600;6..96,700&family=Jost:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600;6..96,700&family=Jost:wght@300;400;500;600;700&display=swap');
```

**Why this pairing over the generated Cormorant + Montserrat:** Jost is the closest freely licensed analogue to Futura, which is the geometric sans both reference brands build their wordmarks on. Cormorant reads as bridal/spa rather than heritage apparel. Bodoni Moda supplies the high-contrast didone note that fashion editorial uses, and is confined to the hero so the interface stays single-voiced.

**Type rules:**

- Interface chrome (nav, buttons, section titles, category tiles, badges) is **uppercase Jost with wide tracking**, never bold. Weight 400–500 only; 600+ reads as sportswear, not luxury.
- Tracking tokens: `--tracking-wide: 0.08em` for words, `--tracking-wider: 0.18em` for short uppercase labels. The wordmark goes further at `0.32em`.
- Headings sit at weight 500. Emphasis comes from space and scale, not weight.

### Spacing Variables

*Density: 4/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Corners and Elevation

Surfaces use **soft rounded corners** with light separation (hairline border + whisper shadow).

| Token | Value |
|-------|-------|
| `--radius-sm` | `0.5rem` — chips, small chrome |
| `--radius-md` | `0.75rem` — forms, panels |
| `--radius-lg` / `--radius-tile` / `--radius-soft` | `1.25rem` — cards, tiles, trays, galleries |
| `--radius-btn` | `0.75rem` — buttons and form controls |
| `--shadow-sm` / `--shadow-md` | Prefer soft `1px` borders; tiles may use a whisper shadow |
| `--shadow-lg` | `0 1px 24px rgba(12,10,9,0.08)` — overlays only |
| `--shadow-xl` | `0 1px 40px rgba(12,10,9,0.12)` — modals only |

Hover states change **border colour, background, or soft shadow**, never geometry that shifts layout.

---

## Component Specs

### Buttons

```css
.btn {
  min-height: 2.75rem;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-btn); /* 0.75rem — soft control corner */
  font-size: 0.8125rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
  cursor: pointer;
}

.btn:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-secondary);
}

/* Fills on hover rather than tinting: the canonical luxury-retail secondary. */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
```

Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`. Hover changes background/border only — never elevation or geometry that shifts layout.

### Cards

```css
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 0;
  transition: border-color 200ms ease;
}

.card:hover {
  border-color: var(--color-primary);
}
```

Product imagery may scale to `1.03` inside a clipped frame on hover. The frame itself must not move.

### Section Titles

```css
.section__title {
  font-size: 0.875rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}
```

### Links

Body links share the foreground colour, so they **must** keep an underline. Colour alone is not an available signal in this palette.

---

## Style Guidelines

**Style:** Minimalism & Swiss Style
**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential
**Mode support:** Light supported | Dark supported
**Accessibility:** risk `low`; requires contrast-text-4.5, keyboard, visible-focus, reduced-motion
**Key Effects:** Subtle hover (200–250ms), smooth transitions, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Feature-Rich Showcase

- **Conversion Strategy:** Clear feature hierarchy. One key message per card. Strong CTA repetition.
- **CTA Placement:** Hero (sticky) + After features + Bottom
- **Section Order:** Hero (value prop) > Feature grid/cards (4-6) > Use cases or benefits > Social proof or logos > CTA

---

## Motion

**Scroll Reveal** (Subtle) — Trigger: scroll (viewport enter) | Duration: 300-400ms | Easing: `power1.out`

```js
gsap.from(el, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
```

**Framework notes:** Requires the ScrollTrigger plugin registered once via `gsap.registerPlugin(ScrollTrigger)`; use `matchMedia('(prefers-reduced-motion: reduce)')` to skip non-essential motion and render the final state immediately.

- ✅ Keep the y offset small (8-16px) so it reads as a fade, not a slide
- ❌ Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback

---

## Anti-Patterns (Do NOT Use)

- ❌ **Hard square cards** — prefer soft rounded tiles (`--radius-tile`) over sharp rectangles
- ❌ **Vibrant & Block-based** — the previous Veni direction, and the explicit anti-pattern of this one
- ❌ **Playful colors** — no mint, no orange, no saturated fills
- ❌ Drop shadows for ordinary surface separation (whisper tile shadows OK)
- ❌ Bold (600+) weights in interface chrome
- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid transforms that shift surrounding content
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from a consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum, measured not assumed
- [ ] Links distinguishable without relying on colour
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
