import { PolicyPage } from "../components/content/PolicyPage";
import { TERMS_SECTIONS } from "../content/storefrontPages";

export function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      lead="Ground rules for browsing and ordering from Veni."
      sections={TERMS_SECTIONS}
    />
  );
}
