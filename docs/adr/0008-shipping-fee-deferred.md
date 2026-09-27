# Shipping fee deferred (no fee engine at launch)

Status: accepted

Order totals equal the catalog-derived **subtotal**. There is no shipping-fee calculation, courier integration, or tracking number model in the initial launch.

**Why:** A fee schedule (flat, by city, by weight) is a business decision that must not be invented in code. Frozen contact and shipping address fields on Order are enough to fulfill manually.

**Consequences:** `Order.total == Order.subtotal` until a future ADR introduces shipping charges. Admin marks orders `SHIPPED` without a separate fulfillment subsystem. Delivery estimates live in storefront copy (editable), not in calculated fields.
