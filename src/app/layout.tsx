import type { Metadata } from "next";
import { Suspense } from "react";

import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { absoluteUrl, serializeJsonLd, siteUrl } from "@/lib/seo";
import { ConsentManager } from "@/components/analytics/consent-manager";
import { CartDrawerProvider } from "@/components/cart/cart-drawer-provider";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "CakeIreland | Cakes for Every Occasion",
    template: "%s | CakeIreland",
  },
  description:
    "Beautiful cakes and desserts made for special moments, with delivery and collection across Ireland.",
  openGraph: {
    type: "website",
    siteName: "CakeIreland",
    title: "CakeIreland | Cakes for Every Occasion",
    description:
      "Beautiful cakes and desserts made for special moments, with delivery and collection across Ireland.",
    url: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-background p-3 font-semibold text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${absoluteUrl("/")}#organization`,
              name: "CakeIreland",
              url: absoluteUrl("/"),
            }),
          }}
        />
        <CartDrawerProvider>
          <Header />

          <div id="main-content">{children}</div>

          <Footer />
          <Suspense fallback={null}>
            <ConsentManager />
          </Suspense>
        </CartDrawerProvider>
      </body>
    </html>
  );
}
