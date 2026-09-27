import { PolicyPage } from "../components/content/PolicyPage";
import { SHIPPING_RETURNS_SECTIONS } from "../content/storefrontPages";

export function ShippingReturnsPage() {
  return (
    <PolicyPage
      title="Shipping & returns"
      lead="How Orders leave Veni, and what to do if something is not right."
      sections={SHIPPING_RETURNS_SECTIONS}
    />
  );
}
