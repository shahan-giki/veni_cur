import { useState, type ChangeEvent, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmPaymentProof,
  getPaymentInstructions,
  presignPaymentProof,
  uploadProofToS3,
} from "../../api/payments";
import { formatApiValidationError } from "../../api/client";
import type { OrderStatus } from "../../api/types/order";
import type { CustomerPaymentState } from "../../api/types/payment";
import { orderKeys } from "../../hooks/useOrders";
import { Button } from "../ui/Button";
import { formatPaymentStatus } from "../../lib/paymentDisplay";

type Props = {
  orderId: number;
  /** Public display number (e.g. VENI-00042) for bank transfer reference. */
  orderNumber: string;
  orderStatus: OrderStatus;
  payment: CustomerPaymentState;
  orderTotal: string;
  accessToken?: string;
};

function CopyableValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="payment-copy-row">
      <dt>{label}</dt>
      <dd>
        <code className="payment-copy-row__value">{value}</code>
        <button
          type="button"
          className="payment-copy-row__btn"
          onClick={() => void onCopy()}
          aria-label={`Copy ${label}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </dd>
    </div>
  );
}

export function PaymentProofUpload({
  orderId,
  orderNumber,
  orderStatus,
  payment,
  orderTotal,
  accessToken,
}: Props) {
  const queryClient = useQueryClient();
  const instructionsQuery = useQuery({
    queryKey: ["payments", "instructions"],
    queryFn: getPaymentInstructions,
  });
  const [file, setFile] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showInstructions =
    orderStatus === "PENDING_PAYMENT" || orderStatus === "PAYMENT_VERIFICATION";

  if (!showInstructions) {
    return null;
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a receipt image or PDF to upload.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const presign = await presignPaymentProof(orderId, file, accessToken);
      await uploadProofToS3(presign, file);
      await confirmPaymentProof(
        orderId,
        presign.s3_key,
        referenceNumber.trim(),
        accessToken
      );
      await queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      if (accessToken) {
        await queryClient.invalidateQueries({
          queryKey: orderKeys.byToken(accessToken),
        });
      }
      setFile(null);
      setReferenceNumber("");
    } catch (err) {
      setError(formatApiValidationError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const verifying = orderStatus === "PAYMENT_VERIFICATION";

  return (
    <section className="payment-panel" aria-labelledby="payment-panel-heading">
      <h2 id="payment-panel-heading">Manual payment</h2>
      <p className="payment-panel__amount">
        Amount due: <strong>{orderTotal}</strong> (PKR)
      </p>
      <p className="payment-panel__order-ref">
        Order number: <strong>{orderNumber}</strong>
        <span className="payment-panel__order-hint">
          {" "}
          — use as your transfer reference
        </span>
      </p>
      {instructionsQuery.data ? (
        <dl className="payment-panel__bank">
          <div>
            <dt>Bank</dt>
            <dd>{instructionsQuery.data.bank_name}</dd>
          </div>
          <div>
            <dt>Account title</dt>
            <dd>{instructionsQuery.data.account_title}</dd>
          </div>
          <CopyableValue
            label="Account number"
            value={instructionsQuery.data.account_number}
          />
          <CopyableValue label="IBAN" value={instructionsQuery.data.iban} />
        </dl>
      ) : null}
      {instructionsQuery.data ? (
        <p className="payment-panel__instructions">{instructionsQuery.data.instructions}</p>
      ) : null}
      {verifying ? (
        <p className="payment-panel__badge" role="status">
          Payment is being verified.
        </p>
      ) : payment.status ? (
        <p className="payment-panel__status" role="status">
          Last submission: <strong>{formatPaymentStatus(payment.status)}</strong>
        </p>
      ) : null}
      {payment.rejection_reason ? (
        <p className="auth-form__error" role="alert">
          {payment.rejection_reason}
        </p>
      ) : null}
      {payment.can_upload_proof ? (
        <form
          className="auth-form payment-panel__form"
          onSubmit={(e) => void onSubmit(e)}
        >
          <div className="auth-form__field">
            <label htmlFor="payment-reference">Transfer reference (optional)</label>
            <input
              id="payment-reference"
              type="text"
              maxLength={64}
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              autoComplete="off"
              placeholder={orderNumber}
            />
          </div>
          <div className="auth-form__field">
            <label htmlFor="payment-proof">Payment proof</label>
            <input
              id="payment-proof"
              className="payment-panel__file"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={onFileChange}
            />
          </div>
          {error ? (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            className="btn--soft payment-panel__submit"
            disabled={submitting}
          >
            {submitting ? "Uploading…" : "Submit payment proof"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
