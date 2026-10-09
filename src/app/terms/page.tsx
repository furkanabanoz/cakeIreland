import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using the CakeIreland online shop.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of sale"
      intro="These terms describe the main steps when you place an order through the CakeIreland shop."
      notice="The business's registered identity, address, governing-law wording and final consumer terms must be verified by an Irish legal professional before launch."
      sections={[
        {
          title: "Products and orders",
          paragraphs: [
            "Product descriptions, options, availability and prices are shown on the site and confirmed during checkout. Product appearance may vary from illustrative photographs. Your order request is subject to availability and acceptance by the business.",
            "A checkout confirmation or payment receipt does not remove any consumer rights that apply to your purchase.",
          ],
        },
        {
          title: "Payment",
          paragraphs: [
            "Checkout payments are processed securely by Stripe. The total shown at checkout includes the product, selected options, eligible discounts and the delivery or collection charge shown before you submit payment.",
          ],
        },
        {
          title: "Delivery, collection and custom requests",
          paragraphs: [
            "Available delivery areas, time slots and collection options are presented during checkout and may depend on capacity. Please provide accurate order and fulfilment information. Customization requests are subject to confirmation by the business.",
          ],
        },
        {
          title: "Cancellations, refunds and contact",
          paragraphs: [
            "Please review the Refund Policy and contact the business as soon as possible if you need to change or cancel an order. Nothing in these terms limits mandatory statutory rights.",
          ],
        },
      ]}
    />
  );
}
