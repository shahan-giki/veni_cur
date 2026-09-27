import { PolicyPage } from "../components/content/PolicyPage";
import { CANCELLATION_SECTIONS } from "../content/storefrontPages";

export function CancellationPage() {
  return (
    <PolicyPage
      title="Cancellation Policy"
      lead="When an Order can be cancelled, and when returns apply instead."
      sections={CANCELLATION_SECTIONS}
    />
  );
}
