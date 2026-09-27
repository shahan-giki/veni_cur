import { PolicyPage } from "../components/content/PolicyPage";
import { PRIVACY_SECTIONS } from "../content/storefrontPages";

export function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      lead="How Veni handles the personal information you share when you shop."
      sections={PRIVACY_SECTIONS}
    />
  );
}
