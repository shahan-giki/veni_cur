# Saved addresses deferred

Status: accepted

Customers enter contact and shipping fields at checkout; those values are frozen onto the Order. There is **no saved address book** (list/create/update/delete of reusable addresses) at launch.

**Why:** Checkout already captures the five frozen fields required for fulfillment. An address book adds models, APIs, and account UI without unblocking guest or authenticated purchase.

**Consequences:** Prefill at checkout may use the signed-in Customer’s name/email only. A future ADR may introduce `CustomerAddress` without changing Order snapshot immutability.
