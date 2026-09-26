# Veni

Veni is a single-merchant, multi-category B2C e-commerce store. Customers browse Veni-owned products, build a cart across any categories, check out while logged in, pay manually, and upload payment proof. Administrators manage the catalog, orders, and payment verification.

## Language

**User**:
A person with an account on Veni. Every user is either a Customer or an Admin.
_Avoid_: Account (when meaning the person), member, client

**Customer**:
A User who shops on the storefront: browse, cart, checkout, orders, payment upload.
_Avoid_: Buyer, shopper (informal only), guest (not used for checkout in initial scope)

**Admin**:
A User who manages Veni’s catalog, orders, and payment verification through the admin console.
_Avoid_: Staff (unless referring to Django `is_staff`), moderator, seller

**Category**:
A data-driven grouping for products (e.g. Skincare, Shawls). Categories are created and ordered in admin, not hardcoded in the frontend.
_Avoid_: Collection (unless marketing copy), department (UI label ok)

**Product**:
A generic sellable item in Veni’s catalog. One product belongs to one category. Product type is never encoded as separate code types per vertical.
_Avoid_: Listing, SKU (SKU belongs to Variant), item (too vague)

**Product variant**:
The purchasable unit when options exist (size, volume, color, etc.). Inventory authority lives at the variant level. A product with no meaningful options uses a single default variant.
_Avoid_: Option (UI label ok), SKU-only row without variant concept

**Product image**:
A gallery image for a product, stored in S3; Postgres holds metadata and object key only.
_Avoid_: Asset, media blob

**Cart**:
The Customer’s pre-checkout basket of variant lines and quantities.
_Avoid_: Bag (UI label ok), basket (UI label ok)

**Cart item**:
One line in a Cart: a variant and quantity. Prices shown in the cart come from the server on each update.
_Avoid_: Line item (use for orders), row

**Checkout**:
The authenticated flow that validates the cart, captures shipping/customer information, and creates an Order. Login is required before checkout.
_Avoid_: Purchase (verb), payment (checkout creates the order; payment is a separate step)

**Order**:
A placed purchase with frozen customer/shipping details and server-computed totals.
_Avoid_: Transaction, purchase

**Order item**:
A snapshot line on an Order: product name, variant label, unit price, quantity, and related fields at purchase time. Order items do not change when catalog prices change later.
_Avoid_: Cart item (pre-checkout only)

**Payment**:
Manual payment record for an Order: proof upload, review state, and admin verification. There is no automatic payment gateway in initial scope.
_Avoid_: Transaction (ambiguous with card gateways), receipt (customer-facing proof ok)

**Payment proof**:
The screenshot or image a Customer uploads after paying outside the system. Stored privately in S3; admins review it before verifying or rejecting.
_Avoid_: Screenshot-only naming in domain docs (file may be image formats)

**Payment status**:
The lifecycle of a Payment (e.g. pending review, verified, rejected). Only the backend and admins change verification outcomes.
_Avoid_: Paid (use Order status where appropriate), approved (use verified)

**Order status**:
Fulfillment and payment-related state of an Order (exact enum defined in implementation). Updated by rules tied to checkout and payment verification, not by the storefront alone.
_Avoid_: Shipping status as a separate concept until fulfillment is modeled

**Manual payment**:
Payment made outside Veni (bank transfer, wallet, etc.) before proof upload. Instructions are served by the backend, not invented on the client.
_Avoid_: Offline payment (ok in UI copy), gateway payment (out of scope)

**Storefront**:
The customer-facing React application: catalog, cart, checkout, orders, payment upload.
_Avoid_: Website (too broad), shop (ok in marketing)

**Admin console**:
The admin-facing React application area for catalog, orders, and payments.
_Avoid_: Back office, CMS

**Effective price**:
The unit price used for cart and checkout: sale price when set, otherwise base price, resolved on the server per variant.
_Avoid_: Display price, client price
