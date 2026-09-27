import { Link } from "react-router-dom";
import { ContentPage } from "../components/content/ContentPage";
import { SOCIALS } from "../content/storefrontPages";

export function SocialsPage() {
  return (
    <ContentPage
      title="Socials"
      lead="Follow Veni on the channels below. Links appear here as we publish each profile."
    >
      <ul className="socials-list">
        {SOCIALS.map((social) => {
          const ready = Boolean(social.href.trim());
          return (
            <li key={social.label} className="socials-list__item">
              {ready ? (
                <a
                  className="socials-list__link"
                  href={social.href.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.label}
                </a>
              ) : (
                <span className="socials-list__pending">
                  <span className="socials-list__label">{social.label}</span>
                  <span className="socials-list__hint">Coming soon</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="socials-list__note">
        Prefer email? See <Link to="/contact">Contact</Link> for how to reach the shop
        directly.
      </p>
    </ContentPage>
  );
}
