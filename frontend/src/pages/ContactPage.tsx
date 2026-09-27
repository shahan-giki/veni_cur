import { Link } from "react-router-dom";
import { ContentPage } from "../components/content/ContentPage";
import { CONTACT } from "../content/storefrontPages";

export function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      lead="Questions about an Order, a Product, or shipping — write to us."
    >
      <dl className="content-page__facts">
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </dd>
        </div>
        <div>
          <dt>Hours</dt>
          <dd>{CONTACT.hours}</dd>
        </div>
        <div>
          <dt>Response</dt>
          <dd>{CONTACT.response}</dd>
        </div>
      </dl>

      <section className="content-page__section" aria-labelledby="contact-orders-heading">
        <h2 id="contact-orders-heading" className="section__title">
          About an Order
        </h2>
        <p>
          Include your Order number when you write. You can find it under{" "}
          <Link to="/account/orders">Account → Orders</Link> after you sign in.
        </p>
      </section>

      <section className="content-page__section" aria-labelledby="contact-policy-heading">
        <h2 id="contact-policy-heading" className="section__title">
          Shipping & returns
        </h2>
        <p>
          Timing, returns, and exchanges are set out on our{" "}
          <Link to="/shipping-returns">Shipping & returns</Link> page.
        </p>
      </section>
    </ContentPage>
  );
}
