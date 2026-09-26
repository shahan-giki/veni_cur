# Payment rejection and customer re-upload

Status: accepted

When an Admin **rejects** a payment proof, the Customer may submit a new proof for the same order, governed by an explicit payment/order state machine implemented in the payments service (Phase 6+). Re-upload does not bypass admin review; each submission is stored in S3 with metadata, and verification remains admin-only.

**Considered options:** Single upload only (rejected: poor UX for typos and wrong transfer references); automatic retry without audit (rejected).

**Consequences:** Payment history may retain prior rejected uploads for audit; API must define allowed transitions (e.g. rejected → pending review on new upload). Order status must stay consistent with payment transitions.
