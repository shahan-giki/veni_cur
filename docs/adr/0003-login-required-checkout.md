# Guest checkout allowed (amended: was login-required checkout)

Status: accepted (amended 2026-09-26)

Guest checkout is permitted. A Customer may browse, build a Cart, place an Order, and upload
Payment proof without creating an account. Signing in remains optional and is offered, never
required.

## Original decision (superseded by the amendment below)

Checkout and order placement required an authenticated Customer. Anonymous/guest checkout was out
of scope; Carts were tied to authenticated users, with no guest cart merge flow in Phase 2–7.

**Considered options:** Guest checkout with email-only orders (rejected for initial scope: simpler
fraud, payment proof, and order history model).

## Amendment

Registration is a conversion cost we are no longer willing to pay for a first purchase. The
original rejection stands only as a set of problems to solve, not a reason to refuse:

- **Order identity.** A guest Order has no `customer` FK, so contact and shipping details must be
  captured at checkout and frozen onto the Order itself.
- **Payment proof re-entry.** Manual payment review can reject a receipt (ADR-0004), so a guest
  needs a durable way back to their Order days later, without a password.
- **Order history.** Guests have no account to list Orders against; they reach a single Order
  directly.

**Prerequisite discovered while amending this ADR:** the Order model captures no contact or
shipping details at all, for guests *or* signed-in Customers — `CONTEXT.md` describes Order as
holding "frozen customer/shipping details", but no such fields exist and checkout never collects
them. Guest checkout cannot ship without them, so capturing them is the first step and is required
regardless of this amendment.

## Consequences

- `Order.customer` becomes nullable; a guest Order is identified by its own frozen contact details.
- Order must gain frozen contact and shipping fields, collected during Checkout for every Order.
- Cart is no longer restricted to authenticated users; a guest Cart is held client-side and merged
  into the server Cart on sign-in.
- Cart and Payment endpoints must authorize by Order ownership *or* a guest's proof of Order
  access, not by authentication alone.
- Admin payment verification is unchanged: an Admin reviews the same Payment records either way.
- Signing in must remain worthwhile (Order history, saved details) without ever being mandatory.
