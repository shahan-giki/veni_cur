import { Link, useLocation, useParams } from "react-router-dom";
import { formatApiValidationError } from "../api/client";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { useOrderDetail } from "../hooks/useOrders";
import { PaymentProofUpload } from "../components/orders/PaymentProofUpload";
import { formatOrderStatus, orderItemVariantLabel } from "../lib/orderDisplay";
import { formatPrice } from "../lib/formatPrice";

export function OrderDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const orderId = Number.parseInt(id, 10);
  const location = useLocation();
  const placed = Boolean((location.state as { placed?: boolean } | null)?.placed);

  const orderQuery = useOrderDetail(Number.isFinite(orderId) ? orderId : 0);

  if (!Number.isFinite(orderId) || orderId < 1) {
    return <StatePanel title="Order not found" />;
  }

  if (orderQuery.isPending || orderQuery.isLoading) {
    return <LoadingGrid count={3} />;
  }

  if (orderQuery.isError) {
    return (
      <StatePanel
        title="Order not found"
        message={formatApiValidationError(orderQuery.error)}
        actions={
          <Link to="/account/orders" className="btn btn-secondary">
            All orders
          </Link>
        }
      />
    );
  }

  const order = orderQuery.data!;

  return (
    <section className="order-detail" aria-labelledby="order-detail-heading">
      <header className="page-header">
        <h1 id="order-detail-heading">Order #{order.id}</h1>
        {placed ? (
          <p className="add-to-cart__ok" role="status">
            Thank you — your order was placed. Submit your payment proof below when ready.
          </p>
        ) : null}
        <p>
          {new Date(order.created_at).toLocaleString()} ·{" "}
          {formatOrderStatus(order.status)}
        </p>
        <p>
          <Link to="/account/orders">All orders</Link> · <Link to="/account">Account</Link>
        </p>
      </header>
      <ul className="checkout-lines" aria-label="Order items">
        {order.items.map((item) => (
          <li key={item.id} className="checkout-line">
            <div>
              <strong>{item.product_name_snapshot}</strong>
              <p className="checkout-line__meta">
                {orderItemVariantLabel(item)}
                {item.sku_snapshot ? ` · SKU ${item.sku_snapshot}` : ""} · Qty{" "}
                {item.quantity}
              </p>
            </div>
            <span>{formatPrice(item.line_total)}</span>
          </li>
        ))}
      </ul>
      <p className="cart-summary__subtotal">
        Total: <strong>{formatPrice(order.total)}</strong>
      </p>
      <p className="cart-summary__note">
        Prices shown are frozen at order time and will not change if catalog prices
        update later.
      </p>
      <PaymentProofUpload
        orderId={order.id}
        orderStatus={order.status}
        payment={order.payment}
        orderTotal={formatPrice(order.total)}
      />
      <Link to="/products" className="btn btn-secondary">
        Continue shopping
      </Link>
    </section>
  );
}
