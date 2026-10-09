
"use client";

import { useState, useTransition } from "react";
import { applyCoupon } from "@/actions/coupon";

interface CouponFormProps {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    product: {
      categoryId: string;
    };
  }[];
  subtotal: number;
  onCouponChange?: (
    coupon: { discount: number; freeDelivery: boolean } | null
  ) => void;
}

export function CouponForm({
  items,
  subtotal,
  onCouponChange,
}: CouponFormProps) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [discount, setDiscount] =
    useState<number | null>(null);
  const [appliedCode, setAppliedCode] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  function handleApply() {
    setMessage("");

    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setMessage("Please enter a coupon code.");
      return;
    }

    startTransition(async () => {
      const result = await applyCoupon({
        code: trimmedCode,
        subtotal,
        items: items.map((item) => ({
          productId: item.productId,
          categoryId: item.product.categoryId,
          subtotal: item.unitPrice * item.quantity,
        })),
      });

      if (!result.success) {
        setDiscount(null);
        setAppliedCode("");
        onCouponChange?.(null);
        setMessage(
          result.error ??
            "Unable to apply coupon."
        );
        return;
      }

      const couponDiscount =
        result.coupon?.discount ?? 0;

      setDiscount(couponDiscount);
      onCouponChange?.({
        discount: couponDiscount,
        freeDelivery: result.coupon?.freeDelivery ?? false,
      });
      setAppliedCode(
        result.coupon?.code ?? trimmedCode
      );

      setMessage(
        `Coupon ${
          result.coupon?.code ?? trimmedCode
        } applied successfully.`
      );
    });
  }

  function handleRemove() {
    setCode("");
    setDiscount(null);
    setAppliedCode("");
    onCouponChange?.(null);
    setMessage("");
  }

  return (
    <div className="mt-6 border-t pt-6">
      <input
        type="hidden"
        name="couponCode"
        value={appliedCode}
      />

      <h3 className="text-sm font-semibold">
        Have a coupon?
      </h3>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value.toUpperCase()
            )
          }
          placeholder="Coupon code"
          disabled={
            isPending ||
            discount !== null
          }
          className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
        />

        {discount !== null ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="rounded-xl border px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-50"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            disabled={isPending}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending
              ? "Applying..."
              : "Apply"}
          </button>
        )}
      </div>

      {message && (
        <p
          className={`mt-2 text-sm ${
            discount !== null
              ? "text-green-600"
              : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}

      {discount !== null && (
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-muted-foreground">
            Coupon discount
          </span>

          <span className="font-semibold text-green-600">
            -€{discount.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
