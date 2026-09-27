# Veni — Brand Guidelines

Source of truth for Veni's brand voice, visual identity, and messaging. Design tokens in
`frontend/src/styles/veni-tokens.css` and the rules in
[`design-system/veni/MASTER.md`](../design-system/veni/MASTER.md) must stay consistent with this file.

Domain terms used here are defined in [`CONTEXT.md`](../CONTEXT.md). Use them exactly: **Customer**,
**Admin**, **Category**, **Product**, **Product variant**, **Cart**, **Order**, **Payment**,
**Payment proof**, **Storefront**, **Admin console**, **Effective price**.

## 1. Positioning

Veni is a **single-merchant, multi-category store** selling considered goods — skincare, oral care,
perfumes, shawls, Peshawari chappals — to customers who would otherwise buy these things from five
different sellers of varying trustworthiness.

The brand promise is **curation and confidence**, not discovery or discounting. A Customer is not
browsing a marketplace of competing sellers; every Product on Veni is Veni's. That is the single
most important fact about the brand, and it licenses a quieter, more assured tone than a
marketplace can use.

**Register:** heritage retail. Restrained, physical, unhurried. The reference points are apparel
houses that sell one catalogue well rather than platforms that sell everything.

## 2. Voice

Veni speaks like a shopkeeper who knows the stock, not like a growth team.

| Trait | We do | We don't |
|-------|-------|----------|
| **Assured** | State the fact: "Ships in 2–3 days." | Oversell it: "Lightning-fast delivery!!" |
| **Plain** | "Sale price applies at checkout." | "Unlock exclusive savings." |
| **Concrete** | Name the material, size, volume, origin. | Reach for "premium", "luxurious", "amazing". |
| **Unhurried** | Let whitespace and product imagery carry weight. | Countdown timers, "Only 2 left!!", urgency theatre. |
| **Candid** | "Payment is verified manually, usually within one business day." | Hide the manual step or imply instant confirmation. |

### Rules

- **No exclamation marks in interface copy.** They're available in transactional email at most.
- **Sentence case for sentences, uppercase for labels.** Never Title Case Every Word.
- **Never use an emoji as an icon or as tone.** Use the icon set; see the design system.
- **Say what failed and what to do.** "That variant is out of stock. Choose another size." beats
  "Something went wrong."
- **Own the manual payment flow.** It is a deliberate choice for this market, not an apology. Explain
  it plainly wherever a Customer meets it.

### Vocabulary

Customer-facing copy may soften a few domain terms; everything else uses `CONTEXT.md` wording.

| Domain term | Allowed UI label | Never |
|-------------|------------------|-------|
| Cart | Cart, Bag, Basket | Trolley |
| Product variant | Option, Size, Volume | Variant (internal word) |
| Payment proof | Receipt, Payment screenshot | Proof of payment (stiff) |
| Category | Category, Department | Collection (marketing copy only) |
| Effective price | Price | Display price, Your price |

Never expose internal vocabulary to a Customer: no "SKU", no "variant", no "queryset", no status
enum strings rendered raw (`AWAITING_PAYMENT` is copy work, not a label).

## 3. Visual identity

Full specification lives in [`design-system/veni/MASTER.md`](../design-system/veni/MASTER.md).
The brand-level commitments:

### Wordmark

**VENI**, set in Jost, weight 500, uppercase, letter-spacing `0.32em`, in `#0C0A09`.
No logotype graphic, no monogram, no icon lockup. The tracking *is* the wordmark — reproducing it
tightly spaced is a misuse.

### Palette

Warm neutral, near-monochrome. One accent, used sparingly.

| Role | Hex | Where it's allowed |
|------|-----|--------------------|
| Ink | `#0C0A09` | Body text, wordmark |
| Primary | `#1C1917` | Primary actions, borders on hover |
| Paper | `#FAFAF9` | Page background |
| Card | `#FFFFFF` | Surfaces |
| Border | `#D6D3D1` | All surface separation |
| Stone | `#57534E` | Secondary text, prices in listings |
| Gold | `#A16207` | Sale, limited availability, admin attention — **never** a primary button |
| Destructive | `#DC2626` | Errors and destructive confirmation only |

Gold is the only chromatic colour in the system. If more than one element per screen is gold, the
screen is wrong.

### Typography

- **Jost** — everything: interface, headings, body.
- **Bodoni Moda** — the hero headline only.

Interface chrome is uppercase and tracked, never bold. Weights 300–500 only.

### Photography

Product on plain warm-neutral ground, square crop, generous margin, even light, no props. Every
Product image is a **Product image** per `CONTEXT.md`: stored in S3, metadata only in Postgres.
Square 1:1 is the committed aspect ratio — the grid depends on it.

## 4. Messaging framework

**One-liner:** Veni is one shop for skincare, fragrance, and the things you wear — stocked and
shipped by us.

**Value pillars**, in the order they should appear on a landing page:

1. **One cart, every category.** Build a single Cart across Skincare, Perfumes, Shawls and
   Chappals, and check out once.
2. **Stocked by Veni.** Not a marketplace. Every Product is ours, so availability and condition
   are ours to answer for.
3. **Pay the way you already pay.** Bank transfer or wallet, then upload the receipt. An Admin
   verifies it, usually within one business day.

Pillar 3 is a differentiator in this market, not a limitation. Lead with it rather than burying it
in checkout.

**Proof over adjectives.** Prefer a stated fact ("17 variants across 5 categories") to a claim
("huge selection"). If a number isn't available yet, cut the sentence rather than inflating it.

## 5. Consistency checklist

Before shipping customer-facing copy or UI:

- [ ] Terms match `CONTEXT.md`, or an approved UI label from §2
- [ ] No exclamation marks, no emoji, no Title Case headings
- [ ] No urgency theatre (timers, fake scarcity)
- [ ] At most one gold element on screen; primary action is near-black
- [ ] Wordmark tracking intact at `0.32em`
- [ ] Error copy names the cause and the next action
- [ ] Contrast measured against the real background, not assumed
- [ ] Manual payment explained wherever it's first encountered
