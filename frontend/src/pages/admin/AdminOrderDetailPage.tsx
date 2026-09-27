import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminPaymentProof,
  rejectAdminPayment,
  verifyAdminPayment,
} from "../../api/admin/payments";
import {
  getAdminOrder,
  patchAdminOrderCourier,
  patchAdminOrderStatus,
} from "../../api/admin/orders";
import { formatApiValidationError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";
import { formatPrice } from "../../lib/formatPrice";
import {
  formatOrderNumber,
  formatOrderStatus,
  formatPaymentMethod,
} from "../../lib/orderDisplay";

export function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const orderId = Number.parseInt(id, 10);
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierNotes, setCourierNotes] = useState("");
  const [courierSaved, setCourierSaved] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["admin", "orders", orderId],
    queryFn: () => getAdminOrder(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

  useEffect(() => {
    const order = orderQuery.data;
    if (!order) return;
    setCourierName(order.courier_name ?? "");
    setTrackingNumber(order.courier_tracking_number ?? "");
    setCourierNotes(order.courier_notes ?? "");
  }, [orderQuery.data]);

  const pendingPayment = orderQuery.data?.payments.find((p) => p.status === "PENDING");

  const proofQuery = useQuery({
    queryKey: ["admin", "payment-proof", pendingPayment?.id],
    queryFn: () => getAdminPaymentProof(pendingPayment!.id),
    enabled: Boolean(pendingPayment?.id),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyAdminPayment(pendingPayment!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId] });
      setActionError(null);
    },
    onError: (err) => setActionError(formatApiValidationError(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectAdminPayment(pendingPayment!.id, rejectReason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId] });
      setRejectReason("");
      setActionError(null);
    },
    onError: (err) => setActionError(formatApiValidationError(err)),
  });

  const shipMutation = useMutation({
    mutationFn: () => patchAdminOrderStatus(orderId, "SHIPPED"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId] });
    },
    onError: (err) => setActionError(formatApiValidationError(err)),
  });

  const courierMutation = useMutation({
    mutationFn: () =>
      patchAdminOrderCourier(orderId, {
        courier_name: courierName,
        tracking_number: trackingNumber,
        notes: courierNotes,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "orders", orderId], data);
      setCourierSaved(true);
      setActionError(null);
    },
    onError: (err) => setActionError(formatApiValidationError(err)),
  });

  if (!Number.isFinite(orderId)) return <StatePanel title="Invalid order" />;
  if (orderQuery.isLoading) return <LoadingGrid count={3} />;
  if (orderQuery.isError || !orderQuery.data) {
    return (
      <StatePanel
        title="Order not found"
        message={formatApiValidationError(orderQuery.error)}
      />
    );
  }

  const order = orderQuery.data;
  const slip = order.courier_slip;
  const isCod = order.payment_method === "CASH_ON_DELIVERY";

  return (
    <section aria-labelledby="admin-order-heading">
      <p>
        <Link to="/admin/orders">← Orders</Link>
      </p>
      <h1 id="admin-order-heading" className="admin-page-title">
        Order {formatOrderNumber(order.id)}
      </h1>
      <p>
        {formatOrderStatus(order.status)} · {formatPaymentMethod(order.payment_method)} ·{" "}
        {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="admin-card">
        <h2>Ship to</h2>
        <p>
          <strong>{order.contact_name}</strong>
          <br />
          {order.contact_phone}
          <br />
          {order.contact_email}
          <br />
          {order.shipping_address}
          <br />
          {order.shipping_city}
        </p>
        {order.customer ? (
          <p className="admin-muted">
            Account: {order.customer.first_name} {order.customer.last_name} (
            {order.customer.email})
          </p>
        ) : (
          <p className="admin-muted">Guest order</p>
        )}
      </div>

      <div className="admin-card">
        <h2>Items</h2>
        <ul className="checkout-lines">
          {order.items.map((item) => (
            <li key={item.id} className="checkout-line">
              <span>
                {item.product_name_snapshot} · Qty {item.quantity}
              </span>
              <span>{formatPrice(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <p>
          Total: <strong>{formatPrice(order.total)}</strong>
          {isCod ? " · Collect COD" : ""}
        </p>
      </div>

      <div className="admin-card" aria-labelledby="courier-slip-heading">
        <h2 id="courier-slip-heading">Courier-ready slip</h2>
        <p className="admin-muted">
          Copy these fields into your courier booking screen (TCS, Leopards, CallCourier,
          etc.).
        </p>
        {slip ? (
          <dl className="courier-slip">
            <div>
              <dt>Order number</dt>
              <dd>{slip.order_number}</dd>
            </div>
            <div>
              <dt>Consignee</dt>
              <dd>{slip.consignee_name}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{slip.consignee_phone}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {slip.consignee_address}, {slip.consignee_city}
              </dd>
            </div>
            <div>
              <dt>Pieces</dt>
              <dd>{slip.pieces}</dd>
            </div>
            <div>
              <dt>Payment mode</dt>
              <dd>
                {slip.payment_mode}
                {slip.payment_mode === "COD"
                  ? ` · Collect ${formatPrice(String(slip.cod_amount))}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt>Contents</dt>
              <dd>{slip.product_description}</dd>
            </div>
          </dl>
        ) : null}

        <form
          className="admin-form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            setCourierSaved(false);
            courierMutation.mutate();
          }}
        >
          <label htmlFor="courier-name">Courier name</label>
          <input
            id="courier-name"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
            placeholder="e.g. TCS"
            autoComplete="off"
          />
          <label htmlFor="tracking-number">Tracking number</label>
          <input
            id="tracking-number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="After booking"
            autoComplete="off"
          />
          <label htmlFor="courier-notes">Courier notes</label>
          <textarea
            id="courier-notes"
            rows={2}
            value={courierNotes}
            onChange={(e) => setCourierNotes(e.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={courierMutation.isPending}>
            {courierMutation.isPending ? "Saving…" : "Save courier details"}
          </Button>
          {courierSaved ? (
            <p className="add-to-cart__ok" role="status">
              Courier details saved.
            </p>
          ) : null}
        </form>
      </div>

      <div className="admin-card">
        <h2>Payment verification</h2>
        {isCod ? (
          <p>Cash on delivery — no bank proof required. Collect payment with the courier.</p>
        ) : null}
        {!isCod && order.payments.length === 0 ? (
          <p>No payment submissions yet.</p>
        ) : null}
        {order.payments.length > 0 ? (
          <ul>
            {order.payments.map((p) => (
              <li key={p.id}>
                #{p.id} · {p.status} · {formatPrice(p.amount)}
                {p.reference_number ? ` · Ref ${p.reference_number}` : ""}
                {p.rejection_reason ? ` — ${p.rejection_reason}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
        {pendingPayment ? (
          <>
            {proofQuery.isLoading ? <LoadingGrid count={1} /> : null}
            {proofQuery.data?.url ? (
              <img
                src={proofQuery.data.url}
                alt="Payment proof"
                className="admin-proof-image"
              />
            ) : null}
            {actionError ? (
              <p className="auth-form__error" role="alert">
                {actionError}
              </p>
            ) : null}
            <div className="admin-actions">
              <Button
                variant="primary"
                disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate()}
              >
                Verify payment
              </Button>
            </div>
            <div className="admin-form-grid">
              <label htmlFor="reject-reason">Rejection reason</label>
              <textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button
                variant="danger"
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                onClick={() => rejectMutation.mutate()}
              >
                Reject payment
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {order.status === "PROCESSING" ? (
        <div className="admin-actions">
          <Button
            variant="primary"
            disabled={shipMutation.isPending}
            onClick={() => shipMutation.mutate()}
          >
            Mark as shipped
          </Button>
        </div>
      ) : null}
    </section>
  );
}
