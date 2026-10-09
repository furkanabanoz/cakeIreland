"use client";

import type { FormEvent, ReactNode } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics";

export function CheckoutForm({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    trackAnalyticsEvent("add_payment_info", {
      payment_type: "Stripe",
      currency: "EUR",
    });
  }

  return (
    <form
      action="/api/checkout"
      method="POST"
      className={className}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
}
