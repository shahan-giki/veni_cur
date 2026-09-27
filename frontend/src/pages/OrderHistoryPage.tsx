import { Link } from "react-router-dom";
import { formatApiValidationError } from "../api/client";
import { DocumentTitle } from "../components/seo/DocumentTitle";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { useOrderList } from "../hooks/useOrders";
import { formatPrice } from "../lib/formatPrice";
import { formatOrderStatus, formatOrderNumber } from "../lib/orderDisplay";
import { formatPaymentStatus } from "../lib/paymentDisplay";

export function OrderHistoryPage() {
  const ordersQuery = useOrderList(1);

  if (ordersQuery.isLoading) {
    return <LoadingGrid count={3} />;
  }

  if (ordersQuery.isError) {
    return (
      <StatePanel
        title="Could not load orders"
        message={formatApiValidationError(ordersQuery.error)}
        actions={
          <Button variant="primary" onClick={() => ordersQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const orders = ordersQuery.data?.results ?? [];
  if (orders.length === 0) {
    return (
      <StatePanel
        title="No orders yet"
        message="When you place an order, it will appear here."
        actions={
          <Link to="/products" className="btn btn-primary btn--soft">
            Shop products
          </Link>
        }
      />
    );
  }

  return (
    <section className="orders-page" aria-labelledby="orders-heading">
      <DocumentTitle title="Your orders" />
      <header className="page-header">
        <h1 id="orders-heading">Your orders</h1>
        <p>
          <Link to="/account">Back to account</Link>
        </p>
      </header>
      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id} className="order-list__item">
            <div>
              <Link to={`/account/orders/${order.id}`}>
                <strong>Order {formatOrderNumber(order.id)}</strong>
              </Link>
              <p className="order-list__meta">
                {new Date(order.created_at).toLocaleString()} ·{" "}
                {formatOrderStatus(order.status)}
                {order.payment_status
                  ? ` · ${formatPaymentStatus(order.payment_status)}`
                  : ""}{" "}
                · {order.item_count} item
                {order.item_count === 1 ? "" : "s"}
              </p>
            </div>
            <span className="order-list__total">{formatPrice(order.total)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
