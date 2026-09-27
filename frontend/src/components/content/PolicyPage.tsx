import { Link } from "react-router-dom";
import type { ContentSection } from "../../content/storefrontPages";
import {
  POLICY_COUNSEL_NOTICE,
  POLICY_DRAFT_LABEL,
} from "../../content/storefrontPages";
import { ContentPage } from "./ContentPage";

type Props = {
  title: string;
  lead: string;
  sections: ContentSection[];
};

/** Policy/content pages built from editable section lists. */
export function PolicyPage({ title, lead, sections }: Props) {
  return (
    <ContentPage title={title} lead={lead}>
      <aside className="content-page__notice" role="note" aria-label="Counsel review notice">
        <p className="content-page__notice-label">{POLICY_DRAFT_LABEL}</p>
        <p>{POLICY_COUNSEL_NOTICE}</p>
      </aside>
      {sections.map((section) => {
        const slug = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
          <section
            key={section.heading}
            className="content-page__section"
            aria-labelledby={`policy-${slug}-heading`}
          >
            <h2 id={`policy-${slug}-heading`} className="section__title">
              {section.heading}
            </h2>
            {section.paragraphs.map((text: string) => (
              <p key={text}>{text}</p>
            ))}
          </section>
        );
      })}
      <section className="content-page__section" aria-labelledby="policy-contact-heading">
        <h2 id="policy-contact-heading" className="section__title">
          Questions
        </h2>
        <p>
          Reach us on the <Link to="/contact">Contact</Link> page.
        </p>
      </section>
    </ContentPage>
  );
}
