import type { Metadata } from "next";

import { CookiePreferencesButton } from "@/components/analytics/cookie-preferences-button";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Cookie and analytics preferences for CakeIreland.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies and analytics"
      intro="Essential browser storage supports sign-in and core shop functions. Optional analytics is off unless you choose to allow it."
      sections={[
        {
          title: "Essential storage",
          paragraphs: [
            "Authentication and security cookies are required for account and checkout functions. They are not used to run advertising.",
          ],
        },
        {
          title: "Optional analytics",
          paragraphs: [
            "If a Google Analytics measurement ID is configured, Google Analytics is loaded only after you accept analytics cookies. The shop sends page views and commerce events to measure how customers use the service. Rejecting analytics does not prevent shopping.",
            "Your preference is stored in a first-party cookie named analytics-consent for up to one year. This preference cookie is used to remember your choice.",
          ],
        },
        {
          title: "Change your choice",
          paragraphs: [
            "You can change your analytics choice at any time. Changing it to reject stops the shop from sending further analytics events.",
          ],
        },
      ]}
    >
      <CookiePreferencesButton />
    </LegalPage>
  );
}
