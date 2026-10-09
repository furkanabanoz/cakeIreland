import Link from "next/link";

import { Container } from "@/components/container";

export function Hero() {
  return (
    <section className="overflow-hidden bg-secondary/40">
      <Container>
        <div className="grid min-h-[520px] items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Made with love in Ireland
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Beautiful cakes for every special moment.
            </h1>

            <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
              Discover delicious cakes, cupcakes and desserts made for
              birthdays, celebrations and unforgettable moments.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Shop Cakes
              </Link>

              <Link
                href="/categories/custom"
                className="inline-flex items-center justify-center rounded-lg border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Custom Cakes
              </Link>
            </div>
          </div>

          <div className="flex min-h-[300px] items-center justify-center rounded-3xl bg-accent/50">
            <div className="text-center">
              <span className="text-7xl">🍰</span>
              <p className="mt-4 text-sm text-muted-foreground">
                CakeIreland
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
