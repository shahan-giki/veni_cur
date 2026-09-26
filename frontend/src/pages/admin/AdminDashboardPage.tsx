import { Link } from "react-router-dom";

export function AdminDashboardPage() {
  return (
    <section aria-labelledby="admin-dashboard-heading">
      <h1 id="admin-dashboard-heading" className="admin-page-title">
        Dashboard
      </h1>
      <p className="cart-summary__note">
        Manage catalog, review manual payments, and update order fulfillment.
      </p>
      <ul className="admin-sidebar__nav" style={{ maxWidth: "20rem" }}>
        <li>
          <Link to="/admin/orders?status=PAYMENT_VERIFICATION">Orders awaiting payment review</Link>
        </li>
        <li>
          <Link to="/admin/products">Products</Link>
        </li>
        <li>
          <Link to="/admin/categories">Categories</Link>
        </li>
      </ul>
    </section>
  );
}
