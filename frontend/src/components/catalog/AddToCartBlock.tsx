import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { PublicProductVariant } from "../../api/types/catalog";
import { formatApiValidationError, ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";
import { useCartMutations } from "../../hooks/useCart";
import { Button } from "../ui/Button";

type Props = {
  productName: string;
  selectedVariant: PublicProductVariant | null;
};

export function AddToCartBlock({ productName, selectedVariant }: Props) {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCartMutations();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(
    null
  );

  const inventory = selectedVariant?.inventory_count ?? 0;
  const canAdd = selectedVariant && inventory > 0 && quantity >= 1 && quantity <= inventory;

  async function onAdd() {
    setFeedback(null);
    if (!selectedVariant) return;
    if (status !== "authenticated" || user?.role !== "CUSTOMER") {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    try {
      await addItem.mutateAsync({ variantId: selectedVariant.id, quantity });
      setFeedback({ type: "ok", message: `${productName} added to cart.` });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/login", { state: { from: window.location.pathname } });
        return;
      }
      setFeedback({ type: "err", message: formatApiValidationError(err) });
    }
  }

  return (
    <div className="add-to-cart">
      <div className="add-to-cart__qty">
        <label htmlFor="add-qty">Quantity</label>
        <input
          id="add-qty"
          type="number"
          min={1}
          max={Math.max(1, inventory)}
          value={quantity}
          disabled={!selectedVariant || inventory <= 0}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(n) && n >= 1) setQuantity(n);
          }}
        />
      </div>
      <Button
        type="button"
        variant="primary"
        disabled={!canAdd || addItem.isPending}
        onClick={() => void onAdd()}
      >
        {addItem.isPending ? "Adding…" : "Add to cart"}
      </Button>
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
