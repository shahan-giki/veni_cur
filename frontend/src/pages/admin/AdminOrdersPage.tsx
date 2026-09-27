import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { listAdminOrders } from "../../api/admin/orders";
import { formatApiValidationError } from "../../api/client";
import { formatPrice } from "../../lib/formatPrice";
import { formatOrderNumber, formatOrderStatus } from "../../lib/orderDisplay";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";

export function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const statusFilter = params.get("status") ?? "";
  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", statusFilter],
    queryFn: () => listAdminOrders({ status: statusFilter || undefined }),
  });

  if (ordersQuery.isLoading) return <LoadingGrid count={4} />;
  if (ordersQuery.isError) {
    return (
      <StatePanel
        title="Could not load orders"
        message={formatApiValidationError(ordersQuery.error)}
      />
    );
  }

  const orders = ordersQuery.data?.results ?? [];

  return (
    <section aria-labelledby="admin-orders-heading">
      <h1 id="admin-orders-heading" className="admin-page-title">
        Orders
      </h1>
      <div className="admin-actions">
        <label>
          Filter by status{" "}
          <select
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value;
              if (v) params.set("status", v);
              else params.delete("status");
              setParams(params);
            }}
          >
            <option value="">All</option>
            <option value="PAYMENT_VERIFICATION">Payment verification</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="SHIPPED">Shipped</option>
          </select>
        </label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Status</th>
              <th scope="col">Total</th>
              <th scope="col">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className={
                  order.status === "PAYMENT_VERIFICATION"
                    ? "admin-table__row--attention"
                    : undefined
                }
              >
                <td>
                  <Link to={`/admin/orders/${order.id}`}>
                    {formatOrderNumber(order.id)}
                  </Link>
                </td>
                <td>{order.customer_email}</td>
                <td>
                  {formatOrderStatus(order.status)}
                  {order.pending_payment_id ? (
                    <span className="admin-badge admin-badge--verify"> Review</span>
                  ) : null}
                </td>
                <td>{formatPrice(order.total)}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
