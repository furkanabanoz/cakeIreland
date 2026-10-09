"use client";

import Link from "next/link";
import { useState } from "react";

import { CouponForm } from "@/components/cart/coupon-form";
import { useCheckoutState } from "./checkout-state";

type CouponItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    categoryId: string;
  };
};

type OrderSummaryItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export function CheckoutSummary({
  items,
  couponItems,
  subtotal,
}: {
  items: OrderSummaryItem[];
  couponItems: CouponItem[];
  subtotal: number;
}) {
  const {
    deliveryType,
    deliveryFee,
    deliveryZoneSelected,
  } = useCheckoutState();
  const [coupon, setCoupon] = useState<{
    discount: number;
    freeDelivery: boolean;
  } | null>(null);

  const chargedDeliveryFee =
    deliveryType === "DELIVERY" && !coupon?.freeDelivery
      ? deliveryFee
      : 0;
  const total = Math.max(
    0,
    subtotal - (coupon?.discount ?? 0) + chargedDeliveryFee
  );

  return (
    <aside className="h-fit rounded-2xl border bg-secondary/30 p-6 lg:sticky lg:top-24">
      <h2 className="text-xl font-bold">Order Summary</h2>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between gap-4 text-sm"
          >
            <span className="text-muted-foreground">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">
              €{(item.unitPrice * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">€{subtotal.toFixed(2)}</span>
        </div>

        <CouponForm
          items={couponItems}
          subtotal={subtotal}
          onCouponChange={setCoupon}
        />

        <div className="mt-4 flex justify-between">
          <span className="text-muted-foreground">
            {deliveryType === "DELIVERY" ? "Delivery" : "Collection"}
          </span>
          <span className="font-medium">
            {deliveryType === "COLLECTION"
              ? "Free"
              : coupon?.freeDelivery
                ? "Free with coupon"
                : deliveryZoneSelected
                  ? `€${deliveryFee.toFixed(2)}`
                  : "Select a delivery area"}
          </span>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold">€{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Continue to Payment
      </button>

      <Link
        href="/cart"
        className="mt-3 flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
      >
        Back to Cart
      </Link>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {deliveryType === "DELIVERY"
          ? "Delivery is calculated from your selected area."
          : "Collection has no delivery fee."}
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Your selected time slot is held while Stripe Checkout is active
        (about 30 minutes).
      </p>
    </aside>
  );
}
