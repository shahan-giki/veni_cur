import { Link, useLocation, useParams } from "react-router-dom";
import { formatApiValidationError } from "../api/client";
import { PaymentProofUpload } from "../components/orders/PaymentProofUpload";
import { OrderConfirmationMeta } from "../components/orders/OrderConfirmationMeta";
import { DocumentTitle } from "../components/seo/DocumentTitle";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { useGuestOrder } from "../hooks/useOrders";
import { formatOrderNumber, orderItemVariantLabel } from "../lib/orderDisplay";
import { formatPrice } from "../lib/formatPrice";

export function GuestOrderPage() {
  const { accessToken = "" } = useParams<{ accessToken: string }>();
  const location = useLocation();
  const placed = Boolean((location.state as { placed?: boolean } | null)?.placed);
  const orderQuery = useGuestOrder(accessToken);

  if (!accessToken) {
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
          <Link to="/products" className="btn btn-secondary btn--soft">
            Shop products
          </Link>
        }
      />
    );
  }

  const order = orderQuery.data!;

  return (
    <section className="order-detail" aria-labelledby="order-detail-heading">
      <DocumentTitle title={`Order ${formatOrderNumber(order.id)}`} />
      <header className="page-header">
        <h1 id="order-detail-heading">Order {formatOrderNumber(order.id)}</h1>
        {placed ? (
          <p className="order-confirm-banner" role="status">
            {order.payment_method === "CASH_ON_DELIVERY"
              ? "Thank you — your cash on delivery order was placed. Bookmark this page for updates."
              : "Thank you — your order was placed. Bookmark this page to return and upload payment proof."}
          </p>
        ) : null}
        <OrderConfirmationMeta
          createdAt={order.created_at}
          status={order.status}
          paymentMethod={order.payment_method}
        />
        {order.contact_email ? (
          <p className="cart-summary__note">
            Confirmation for {order.contact_name} · {order.contact_email}
            {order.shipping_city ? ` · ${order.shipping_city}` : ""}
          </p>
        ) : null}
      </header>
      <ul className="checkout-lines" aria-label="Order items">
        {order.items.map((item) => (
          <li key={item.id} className="checkout-line">
            <div className="checkout-line__info">
              <strong>{item.product_name_snapshot}</strong>
              <span className="checkout-line__qty">Qty {item.quantity}</span>
              {orderItemVariantLabel(item) ? (
                <p className="checkout-line__meta">{orderItemVariantLabel(item)}</p>
              ) : null}
            </div>
            <span className="checkout-line__total">{formatPrice(item.line_total)}</span>
          </li>
        ))}
      </ul>
      <p className="cart-summary__subtotal">
        Total: <strong>{formatPrice(order.total)}</strong>
      </p>
      <PaymentProofUpload
        orderId={order.id}
        orderNumber={formatOrderNumber(order.id)}
        orderStatus={order.status}
        payment={order.payment}
        orderTotal={formatPrice(order.total)}
        accessToken={accessToken}
      />
      <Link to="/products" className="btn btn-secondary btn--soft">
        Continue shopping
      </Link>
    </section>
  );
}
