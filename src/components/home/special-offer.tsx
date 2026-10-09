import Link from "next/link";

import { Container } from "@/components/container";

export function SpecialOffer() {
  return (
    <section className="py-16">
      <Container>
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">
              Special offer
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Make your celebration extra special.
            </h2>

            <p className="mt-4 text-sm leading-6 opacity-90 sm:text-base">
              Discover our selection of cakes and desserts for your next
              celebration.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-lg bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Explore cakes
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
