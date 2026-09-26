import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAdminPaymentProof,
  rejectAdminPayment,
  verifyAdminPayment,
} from "../../api/admin/payments";
import { getAdminOrder, patchAdminOrderStatus } from "../../api/admin/orders";
import { formatApiValidationError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";
import { formatPrice } from "../../lib/formatPrice";
import { formatOrderStatus } from "../../lib/orderDisplay";

export function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const orderId = Number.parseInt(id, 10);
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: ["admin", "orders", orderId],
    queryFn: () => getAdminOrder(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

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

  return (
    <section aria-labelledby="admin-order-heading">
      <p>
        <Link to="/admin/orders">← Orders</Link>
      </p>
      <h1 id="admin-order-heading" className="admin-page-title">
        Order #{order.id}
      </h1>
      <p>
        {formatOrderStatus(order.status)} · {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="admin-card">
        <h2>Customer</h2>
        <p>
          {order.customer.first_name} {order.customer.last_name}
          <br />
          {order.customer.email}
        </p>
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
        </p>
      </div>

      <div className="admin-card">
        <h2>Payment verification</h2>
        {order.payments.length === 0 ? (
          <p>No payment submissions yet.</p>
        ) : (
          <ul>
            {order.payments.map((p) => (
              <li key={p.id}>
                #{p.id} · {p.status} · {formatPrice(p.amount)}
                {p.reference_number ? ` · Ref ${p.reference_number}` : ""}
                {p.rejection_reason ? ` — ${p.rejection_reason}` : ""}
              </li>
            ))}
          </ul>
        )}
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
                variant="secondary"
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
