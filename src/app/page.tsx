import { Suspense } from "react";
import type { Metadata } from "next";

import { BestSellers } from "@/components/home/best-sellers";
import { Categories } from "@/components/home/categories";
import { FAQ } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { Reviews } from "@/components/home/reviews";
import { SpecialOffer } from "@/components/home/special-offer";
import { WhyCakeIreland } from "@/components/home/why-cakeireland";

export const instant = false;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

function SectionFallback({
  titleWidth = "w-48",
  columns = 4,
}: {
  titleWidth?: string;
  columns?: number;
}) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className={`h-5 ${titleWidth} animate-pulse rounded bg-secondary`} />

        <div className="mt-3 h-9 w-72 max-w-full animate-pulse rounded bg-secondary" />

        <div
          className={`mt-8 grid gap-4 ${
            columns === 4
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-secondary"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesFallback() {
  return (
    <SectionFallback
      titleWidth="w-20"
      columns={4}
    />
  );
}

function BestSellersFallback() {
  return (
    <SectionFallback
      titleWidth="w-32"
      columns={4}
    />
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      <Suspense fallback={<CategoriesFallback />}>
        <Categories />
      </Suspense>

      <Suspense fallback={<BestSellersFallback />}>
        <BestSellers />
      </Suspense>

      <WhyCakeIreland />

      <Reviews />

      <SpecialOffer />

      <FAQ />

      <Newsletter />
    </>
  );
}