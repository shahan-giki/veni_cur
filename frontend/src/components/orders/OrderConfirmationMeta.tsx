import {
  formatOrderPlacedAt,
  formatOrderStatus,
  formatPaymentMethod,
  orderStatusTone,
} from "../../lib/orderDisplay";

type Props = {
  createdAt: string;
  status: string;
  paymentMethod?: string | null;
};

export function OrderConfirmationMeta({ createdAt, status, paymentMethod }: Props) {
  const placed = formatOrderPlacedAt(createdAt);
  const tone = orderStatusTone(status);
  const statusLabel = formatOrderStatus(status);

  return (
    <div className="order-confirm-meta">
      <p className={`order-status order-status--${tone}`} role="status">
        <span className="order-status__label">Status</span>
        <span className="order-status__value">{statusLabel}</span>
      </p>
      <dl className="order-placed-fields" aria-label="Order placed at">
        <div className="order-placed-fields__item">
          <dt>Day &amp; time</dt>
          <dd>
            <span className="order-placed-fields__day">{placed.day}</span>
            <span className="order-placed-fields__time">{placed.time}</span>
          </dd>
        </div>
        <div className="order-placed-fields__item">
          <dt>Date</dt>
          <dd>{placed.date}</dd>
        </div>
      </dl>
      {paymentMethod ? (
        <p className="order-confirm-meta__pay">
          Payment: <strong>{formatPaymentMethod(paymentMethod)}</strong>
        </p>
      ) : null}
    </div>
  );
}
