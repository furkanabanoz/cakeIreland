import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How CakeIreland handles account, order and site data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="This page explains the personal information used to operate the CakeIreland shop."
      notice="This draft must be completed with the operating business's legal name, postal address, contact details and verified retention periods before production launch."
      sections={[
        {
          title: "Information we use",
          paragraphs: [
            "Depending on how you use the shop, we process account details, contact and delivery information, order and payment status, product customizations, saved favourites, reviews, and technical information needed to protect the service.",
          ],
        },
        {
          title: "Why we use it",
          paragraphs: [
            "We use account and order information to provide the services you request, take payment, arrange fulfilment, provide customer support, and meet applicable legal obligations. Security and service operation data is used to protect and maintain the site.",
            "Google Analytics is loaded only after you accept analytics cookies. You can reject or later change this preference.",
          ],
        },
        {
          title: "Service providers and payment data",
          paragraphs: [
            "The site uses Stripe to process checkout payments, a hosting and database provider to run the shop, and Resend to send transactional email. Card details are handled by Stripe and are not stored in the shop's order database.",
          ],
        },
        {
          title: "Your choices and rights",
          paragraphs: [
            "You can manage analytics consent from the cookie policy page. You may also request access to or correction or deletion of personal data, subject to records that must be retained by law or to complete an order.",
            "Use the Contact page to reach the business. The responsible business identity and a verified contact address must be supplied before this notice is final.",
          ],
        },
        {
          title: "Retention and complaints",
          paragraphs: [
            "Order, account, security and analytics retention periods must be set by the business based on its legal and operational requirements. No automated retention schedule is currently configured in this application.",
            "You may raise a concern with the Irish Data Protection Commission. This summary should be reviewed against the business's actual data flows before publication.",
          ],
        },
      ]}
    />
  );
}
