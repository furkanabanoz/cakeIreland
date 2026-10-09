import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Information about order changes, cancellations and refunds.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Order changes and refunds"
      intro="If something is wrong with an order, contact the business promptly with your order number so it can be reviewed."
      notice="The final cancellation and refund terms depend on the products offered and applicable Irish and EU consumer law. This draft requires review by an Irish legal professional and confirmation of the business's actual process."
      sections={[
        {
          title: "Requesting a change or cancellation",
          paragraphs: [
            "Made-to-order cakes may require preparation before the selected fulfilment date. Contact the business as soon as possible; a change or cancellation can depend on the preparation stage and applicable law.",
          ],
        },
        {
          title: "Problems with an order",
          paragraphs: [
            "If an order is missing, damaged, incorrect or otherwise not as agreed, contact the business promptly and include your order number and a description of the issue. The business will review the details and explain the available next steps.",
          ],
        },
        {
          title: "Refunds",
          paragraphs: [
            "Where a refund is due, it will be processed through the original payment method where possible. The time for the funds to appear depends on the payment provider and the card issuer. This policy does not limit statutory consumer rights.",
          ],
        },
      ]}
    >
      <p className="text-sm text-muted-foreground">
        See the <Link className="underline" href="/contact">Contact page</Link>{" "}
        for the current support contact.
      </p>
    </LegalPage>
  );
}
