import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { PublicProductVariant } from "../../api/types/catalog";
import { formatApiValidationError } from "../../api/client";
import { useCartMutations } from "../../hooks/useCart";
import { Button } from "../ui/Button";

type Props = {
  productName: string;
  selectedVariant: PublicProductVariant | null;
};

function BagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

export function AddToCartBlock({ productName, selectedVariant }: Props) {
  const navigate = useNavigate();
  const { addItem } = useCartMutations();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(
    null
  );
  const [buying, setBuying] = useState(false);

  const inventory = selectedVariant?.inventory_count ?? 0;
  const canAdd = selectedVariant && inventory > 0 && quantity >= 1 && quantity <= inventory;
  const busy = addItem.isPending || buying;

  async function onAdd() {
    setFeedback(null);
    if (!selectedVariant) return;
    try {
      await addItem.mutateAsync({ variantId: selectedVariant.id, quantity });
      setFeedback({ type: "ok", message: `${productName} added to cart.` });
    } catch (err) {
      setFeedback({ type: "err", message: formatApiValidationError(err) });
    }
  }

  async function onBuyNow() {
    setFeedback(null);
    if (!selectedVariant) return;
    setBuying(true);
    try {
      await addItem.mutateAsync({ variantId: selectedVariant.id, quantity });
      navigate("/checkout");
    } catch (err) {
      setFeedback({ type: "err", message: formatApiValidationError(err) });
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="add-to-cart">
      <div className="add-to-cart__qty">
        <label htmlFor="add-qty">Qty</label>
        <input
          id="add-qty"
          type="number"
          min={1}
          max={Math.max(1, inventory)}
          value={quantity}
          disabled={!selectedVariant || inventory <= 0 || busy}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(n) && n >= 1) setQuantity(n);
          }}
        />
      </div>
      <div className="add-to-cart__actions">
        <Button
          type="button"
          variant="primary"
          className="add-to-cart__btn add-to-cart__btn--primary"
          disabled={!canAdd || busy}
          onClick={() => void onAdd()}
        >
          <span>{addItem.isPending && !buying ? "Adding…" : "Add to cart"}</span>
          <BagIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="add-to-cart__btn add-to-cart__btn--buy"
          disabled={!canAdd || busy}
          onClick={() => void onBuyNow()}
        >
          {buying ? "Buying…" : "Buy now"}
        </Button>
      </div>
      {feedback ? (
        <p
          className={feedback.type === "ok" ? "add-to-cart__ok" : "add-to-cart__error"}
          role="status"
        >
          {feedback.message}
          {feedback.type === "ok" ? (
            <>
              {" "}
              <Link to="/cart">View cart</Link>
            </>
          ) : null}
        </p>
      ) : null}
      {selectedVariant && inventory <= 0 ? (
        <p className="add-to-cart__error" role="alert">
          This option is out of stock.
        </p>
      ) : null}
    </div>
  );
}
