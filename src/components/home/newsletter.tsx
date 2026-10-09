import Link from "next/link";

import { Container } from "@/components/container";

export function Newsletter() {
  return (
    <section className="bg-secondary/30 py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Stay in the cake loop
          </h2>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            We are not accepting newsletter sign-ups just yet. Follow our
            latest cakes in the shop and check back soon.
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Browse cakes
          </Link>
        </div>
      </Container>
    </section>
  );
}
