import type { ReactNode } from "react";
import { DocumentTitle } from "../seo/DocumentTitle";

type Props = {
  title: string;
  lead: string;
  children: ReactNode;
  description?: string;
};

/** Shared shell for long-form storefront pages (contact, policies). */
export function ContentPage({ title, lead, children, description }: Props) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;

  return (
    <article className="content-page" aria-labelledby={headingId}>
      <DocumentTitle title={title} description={description ?? lead} />
      <header className="page-header content-page__header">
        <h1 id={headingId}>{title}</h1>
        <p>{lead}</p>
      </header>
      <div className="content-page__body">{children}</div>
    </article>
  );
}
