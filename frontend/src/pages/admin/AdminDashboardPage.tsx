import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchJson } from "../../api/client";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";
import { formatApiValidationError } from "../../api/client";
import { DocumentTitle } from "../../components/seo/DocumentTitle";

type DashboardData = {
  pending_payments: number;
  orders_awaiting_payment_review: number;
  open_orders: number;
  revenue_in_progress: string;
  low_stock: {
    variant_id: number;
    sku: string;
    inventory_count: number;
    product_id: number;
    product_name: string;
  }[];
};

export function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchJson<DashboardData>("/admin/dashboard/"),
  });

  if (query.isLoading) return <LoadingGrid count={3} />;
  if (query.isError) {
    return (
      <StatePanel
        title="Could not load dashboard"
        message={formatApiValidationError(query.error)}
      />
    );
  }

  const data = query.data!;

  return (
    <section aria-labelledby="admin-dashboard-heading">
      <DocumentTitle title="Admin dashboard" />
      <h1 id="admin-dashboard-heading" className="admin-page-title">
        Dashboard
      </h1>
      <ul className="admin-stat-grid">
        <li>
          <strong>{data.pending_payments}</strong>
          <span>Pending payments</span>
        </li>
        <li>
          <strong>{data.orders_awaiting_payment_review}</strong>
          <span>Awaiting payment review</span>
        </li>
        <li>
          <strong>{data.open_orders}</strong>
          <span>Open orders</span>
        </li>
        <li>
          <strong>Rs {data.revenue_in_progress}</strong>
          <span>In-progress revenue</span>
        </li>
      </ul>
      <p className="cart-summary__note">
        <Link to="/admin/orders?status=PAYMENT_VERIFICATION">
          Review orders awaiting payment
        </Link>
      </p>
      <h2 className="admin-section-title">Low stock (≤ 5)</h2>
      {data.low_stock.length === 0 ? (
        <p className="cart-summary__note">No low-stock variants.</p>
      ) : (
        <ul className="admin-table-list">
          {data.low_stock.map((row) => (
            <li key={row.variant_id}>
              <Link to={`/admin/products/${row.product_id}`}>
                {row.product_name}
              </Link>{" "}
              · {row.sku} · {row.inventory_count} left
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
