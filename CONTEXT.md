# Veni

Veni is a single-merchant, multi-category B2C e-commerce store. Shoppers browse Veni-owned products, build a cart across any categories, check out (as a guest or signed-in Customer), pay manually, and upload payment proof. Administrators manage the catalog, orders, and payment verification.

## Language

**User**:
A person with an account on Veni. Every user is either a Customer or an Admin.
_Avoid_: Account (when meaning the person), member, client

**Customer**:
A User who shops on the storefront: browse, cart, checkout, orders, payment upload. Signing in is optional for a first purchase.
_Avoid_: Buyer, shopper (informal only)

**Guest**:
A shopper without a User account. A Guest may hold a session Cart, place an Order with frozen contact/shipping details, and return to that Order via an opaque access token (not a password).
_Avoid_: Anonymous user (implementation wording only), visitor (UI copy ok)

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
The pre-checkout basket of variant lines and quantities. A guest holds a Cart in their browser session; signing in merges it into the Customer’s Cart. Login is not required to view or change a Cart.
_Avoid_: Bag (UI label ok), basket (UI label ok)

**Cart item**:
One line in a Cart: a variant and quantity. Prices shown in the cart come from the server on each update.
_Avoid_: Line item (use for orders), row

**Checkout**:
The flow that validates the cart (or guest lines), captures contact and shipping information, and creates an Order. Login is optional; guests and Customers both check out.
_Avoid_: Purchase (verb), payment (checkout creates the order; payment is a separate step)

**Order**:
A placed purchase with frozen contact/shipping details and server-computed totals. Guest Orders have no Customer FK; access uses the Order’s access token.
_Avoid_: Transaction, purchase

**Order item**:
A snapshot line on an Order: product name, variant label, unit price, quantity, and related fields at purchase time. Order items do not change when catalog prices change later.
_Avoid_: Cart item (pre-checkout only)

**Payment**:
A record of how an Order is settled: either a manual transfer Payment with proof upload, or cash on delivery collected by courier (no proof file). There is no automatic card gateway in initial scope.
_Avoid_: Transaction (ambiguous with card gateways), receipt (customer-facing proof ok)

**Payment proof**:
The screenshot or image uploaded after paying outside the system (by a Customer or a Guest with Order access). Stored privately in S3; admins review it before verifying or rejecting.
_Avoid_: Screenshot-only naming in domain docs (file may be image formats)

**Shipping fee**:
Not charged as a separate line at launch; Order total equals catalog subtotal until a fee policy is decided (ADR-0008).
_Avoid_: Delivery charge (ok in future UI copy), freight

**Saved address**:
Not modeled at launch; checkout captures one-shot contact/shipping frozen onto the Order (ADR-0009).
_Avoid_: Address book (future), shipping profile

**Payment status**:
The lifecycle of a Payment (e.g. pending review, verified, rejected). Only the backend and admins change verification outcomes.
_Avoid_: Paid (use Order status where appropriate), approved (use verified)

**Order status**:
Fulfillment and payment-related state of an Order (exact enum defined in implementation). Updated by rules tied to checkout and payment verification, not by the storefront alone.
_Avoid_: Shipping status as a separate concept until fulfillment is modeled

**Manual payment**:
Payment made outside Veni (bank transfer, wallet, etc.) before proof upload. Instructions are served by the backend, not invented on the client.
_Avoid_: Offline payment (ok in UI copy), gateway payment (out of scope)

**Cash on delivery (COD)**:
A Payment method where the Customer pays the courier in cash when the parcel is delivered. COD Orders skip payment-proof upload and start in Processing so an Admin can prepare a courier booking.
_Avoid_: COD-only slang in domain docs without expanding once; pay at door (UI copy ok)

**Courier slip**:
Admin-facing consignment fields derived from a frozen Order (consignee, city, pieces, COD amount, order number) for booking with an external courier. Tracking details are stored on the Order after booking.
_Avoid_: Shipping label (ok in UI), logistics integration (not implied)

**Storefront**:
The customer-facing React application: catalog, cart, checkout, orders, payment upload.
_Avoid_: Website (too broad), shop (ok in marketing)

**Admin console**:
The admin-facing React application area for catalog, orders, and payments.
_Avoid_: Back office, CMS

**Effective price**:
The unit price used for cart and checkout: sale price when set, otherwise base price, resolved on the server per variant.
_Avoid_: Display price, client price
