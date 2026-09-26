# Variant-level inventory authority

Status: accepted

Inventory counts and availability checks apply to **Product variant** rows, not to Product directly. When a product has no meaningful options (e.g. a single size), the catalog still uses one **default variant** so checkout, cart, and stock logic stay unified. Admins manage stock per variant in the admin console.

**Considered options:** Product-level inventory with optional variants (rejected: splits logic and allows inconsistent states).

**Consequences:** Product APIs expose purchasable units through variants; cart and order lines always reference a variant id. Product creation in admin always creates or assigns at least one variant.
