/**
 * Storefront static pages — copy lives here so Contact and policy pages stay thin
 * presenters. Edit contact details and policy text in one place.
 *
 * COUNSEL REVIEW STATUS: Draft merchant policies for launch UX only.
 * Not legal advice. Replace or amend after local counsel review before relying
 * on these texts as binding consumer notices.
 */

export const CONTACT = {
  email: "hello@veni.store",
  hours: "Saturday–Thursday, 10:00–18:00 PKT",
  response: "We reply within one business day.",
} as const;

/**
 * Storefront social profiles. Paste each full URL when ready
 * (e.g. "https://instagram.com/veni"). Empty href stays listed as coming soon.
 */
export type SocialLink = {
  label: string;
  href: string;
};

export const SOCIALS: SocialLink[] = [
  { label: "Instagram", href: "" },
  { label: "Facebook", href: "" },
  { label: "TikTok", href: "" },
  { label: "WhatsApp", href: "" },
  { label: "YouTube", href: "" },
];

/** Shown on every policy page until counsel-approved text is substituted. */
export const POLICY_COUNSEL_NOTICE =
  "Draft for counsel review — this page describes how Veni currently operates. It is not formal legal advice and may change. Ask a qualified advisor before treating it as a binding consumer notice.";

export const POLICY_DRAFT_LABEL = "Draft · last updated for storefront launch";

export type ContentSection = {
  heading: string;
  paragraphs: string[];
};

export const SHIPPING_RETURNS_SECTIONS: ContentSection[] = [
  {
    heading: "Shipping",
    paragraphs: [
      "Orders ship after an Admin verifies your payment proof, usually within one business day of a clear receipt.",
      "Most Orders leave within 2–3 business days of verification. You will see the Order status update in your account (or guest Order link).",
      "We ship across Pakistan. Delivery timing depends on your city; expect roughly 2–5 further business days once the parcel is with the courier. Couriers and transit times are outside our direct control.",
      "At launch there is no separate shipping fee line: the Order total equals the catalog subtotal unless we tell you otherwise before you pay. Cash on delivery is available at checkout; you pay the courier when the parcel arrives.",
    ],
  },
  {
    heading: "Returns",
    paragraphs: [
      "If an item arrives damaged, incorrect, or not as described, contact us within 7 days of delivery with your Order number and clear photos of the issue.",
      "Unused items in original packaging may be eligible for return within 14 days of delivery, subject to inspection and stock policy. Fragrance and opened skincare are generally not returnable once the seal is broken, unless the product is faulty.",
      "If we approve a return, we will confirm the refund path with you (manual payments often refund to the same bank or wallet you used). Return shipping is arranged only after we approve the request — do not send items back unsolicited.",
    ],
  },
  {
    heading: "Exchanges",
    paragraphs: [
      "Size or option exchanges may be available when stock allows. Write to us with your Order number and preferred option; we will confirm before you send anything back.",
    ],
  },
];

export const PRIVACY_SECTIONS: ContentSection[] = [
  {
    heading: "What we collect",
    paragraphs: [
      "When you place an Order we store the contact and shipping details you provide, Order line items (name, SKU, price, quantity), and payment proof files you upload.",
      "If you create an account we store your email, name, and password (hashed). Session cookies keep you signed in. Guest Orders are keyed by a private access token — treat that link as confidential.",
    ],
  },
  {
    heading: "How we use it",
    paragraphs: [
      "We use your information to fulfill Orders, verify manual payments, prevent abuse, and reply to support messages.",
      "We do not sell your personal information. Payment proof images are stored privately and reviewed only by Veni Admins.",
    ],
  },
  {
    heading: "Your choices",
    paragraphs: [
      "Contact us to update account details or ask about access to, correction of, or deletion of personal data where applicable under local law.",
      "We retain Order and payment records as needed for fulfillment, dispute handling, and accounting.",
    ],
  },
];

export const TERMS_SECTIONS: ContentSection[] = [
  {
    heading: "Using Veni",
    paragraphs: [
      "Veni is a single-merchant storefront. By browsing and placing Orders you agree to provide accurate contact and shipping information and to pay the Order total using the manual payment instructions we show on your Order.",
      "Catalog descriptions and prices may change. The amounts and item snapshots frozen on your Order at checkout are authoritative for that purchase.",
    ],
  },
  {
    heading: "Accounts and guests",
    paragraphs: [
      "You may check out as a guest or with a Customer account. Guest Orders are accessed via a private link/token — keep it confidential and do not share it.",
      "You are responsible for keeping account credentials private.",
    ],
  },
  {
    heading: "Product information",
    paragraphs: [
      "Product names, images, and descriptions are provided for shopping. They are not medical, therapeutic, or regulatory certifications unless we explicitly state otherwise on the Product page.",
      "If something looks wrong on a Product page, contact us before paying.",
    ],
  },
  {
    heading: "Limitation",
    paragraphs: [
      "To the extent permitted by applicable law, Veni’s responsibility for an Order is limited to the amounts paid for that Order. Nothing on this page excludes rights that cannot be waived under local consumer law.",
    ],
  },
];

export const CANCELLATION_SECTIONS: ContentSection[] = [
  {
    heading: "Before payment is verified",
    paragraphs: [
      "If your Order is still awaiting payment or payment review, contact us promptly with your Order number. We may cancel the Order when payment has not been verified and inventory has not been prepared for shipment.",
      "Admins may also cancel an Order when stock or fulfillment issues prevent shipping. When an Admin cancels, inventory for those Order lines is restocked automatically.",
    ],
  },
  {
    heading: "After shipping",
    paragraphs: [
      "Once an Order is marked shipped, cancellation is generally unavailable. Use the returns process on Shipping & returns if the parcel has a problem on arrival.",
    ],
  },
];

export const PAYMENT_INFO_SECTIONS: ContentSection[] = [
  {
    heading: "Manual payment",
    paragraphs: [
      "Veni does not charge cards online at launch. After you place an Order, transfer the exact total to our Meezan account using the details on your Order page.",
      "Account title: SHAHAN ALI. Bank: Meezan Digital Centre. Copy the account number or IBAN from the Order page, use your Order number (VENI-…) as the transfer reference when possible, then upload a clear screenshot or PDF of the receipt.",
    ],
  },
  {
    heading: "Verification",
    paragraphs: [
      "An Admin reviews each proof. If the proof is unclear or the amount does not match, it may be rejected with a reason so you can upload again.",
      "Orders move toward fulfillment only after payment is verified. Shipping follows verification — uploading a proof does not by itself confirm payment.",
    ],
  },
];
