import Link from "next/link";

import { Container } from "@/components/container";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center py-16">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            404 · Page not found
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-4 text-muted-foreground">
            The page may have moved, or the link may be incorrect.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Browse cakes
          </Link>
        </div>
      </Container>
    </main>
  );
}
