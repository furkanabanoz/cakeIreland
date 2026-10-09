import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact CakeIreland about an order or product.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <main className="py-12 sm:py-16">
      <Container>
        <section className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Contact CakeIreland
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            For help with an existing order, include your order number. For
            allergen questions, contact us before ordering.
          </p>

          {supportEmail ? (
            <p className="mt-8 rounded-2xl border bg-card p-6">
              Email{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="font-semibold text-primary underline underline-offset-4"
              >
                {supportEmail}
              </a>
            </p>
          ) : (
            <p
              role="status"
              className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-50 p-6 text-sm leading-6 text-amber-950"
            >
              Customer support email is not configured. Set
              NEXT_PUBLIC_SUPPORT_EMAIL before opening the shop to customers.
            </p>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            <Link href="/account/orders" className="underline">
              View your orders
            </Link>{" "}
            when signed in.
          </p>
        </section>
      </Container>
    </main>
  );
}
