"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application render failure", {
      digest: error.digest,
      name: error.name,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fffaf5] text-[#382d28]">
        <main className="grid min-h-screen place-items-center px-4 py-16">
          <section className="max-w-lg text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#b83b66]">
              Something went wrong
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              We couldn&apos;t load this page
            </h1>
            <p className="mt-4 text-[#6b625d]">
              Please try again. If the problem continues, come back later.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-8 rounded-xl bg-[#b83b66] px-6 py-3 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
