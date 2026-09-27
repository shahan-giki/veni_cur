import { PolicyPage } from "../components/content/PolicyPage";
import { PAYMENT_INFO_SECTIONS } from "../content/storefrontPages";

export function PaymentInfoPage() {
  return (
    <PolicyPage
      title="Payment Information"
      lead="How manual payment and proof upload work on Veni."
      sections={PAYMENT_INFO_SECTIONS}
    />
  );
}
