"use client";

import { useState, useTransition } from "react";
import {
removeCartItem,
updateCartItem,
} from "@/actions/cart";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface CartItemControlsProps {
cartItemId: string;
quantity: number;
productId: string;
productName: string;
unitPrice: number;
}

export function CartItemControls({
cartItemId,
quantity,
productId,
productName,
unitPrice,
}: CartItemControlsProps) {
const [currentQuantity, setCurrentQuantity] =
useState(quantity);

const [isPending, startTransition] =
useTransition();

function changeQuantity(nextQuantity: number) {
if (nextQuantity < 1) {
return;
}

setCurrentQuantity(nextQuantity);

startTransition(async () => {
  const result = await updateCartItem(
    cartItemId,
    nextQuantity
  );

  if (!result.success) {
    setCurrentQuantity(quantity);
  } else if (nextQuantity > quantity) {
    const addedQuantity = nextQuantity - quantity;
    trackAnalyticsEvent("add_to_cart", {
      currency: "EUR",
      value: unitPrice * addedQuantity,
      items: [
        {
          item_id: productId,
          item_name: productName,
          price: unitPrice,
          quantity: addedQuantity,
        },
      ],
    });
  }

  window.location.reload();
});


}

function handleRemove() {
startTransition(async () => {
const result = await removeCartItem(
cartItemId
);

  if (!result.success) {
    return;
  }

  trackAnalyticsEvent("remove_from_cart", {
    currency: "EUR",
    value: unitPrice * currentQuantity,
    items: [
      {
        item_id: productId,
        item_name: productName,
        price: unitPrice,
        quantity: currentQuantity,
      },
    ],
  });

  window.location.reload();
});


}

return (
<div className="flex items-center justify-between gap-4">
<div className="flex items-center rounded-lg border">
<button
type="button"
disabled={isPending || currentQuantity <= 1}
onClick={() =>
changeQuantity(currentQuantity - 1)
}
className="px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
aria-label="Decrease quantity"
>
−
</button>

    <span className="min-w-10 text-center text-sm font-semibold">
      {currentQuantity}
    </span>

    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        changeQuantity(currentQuantity + 1)
      }
      className="px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Increase quantity"
    >
      +
    </button>
  </div>

  <button
    type="button"
    disabled={isPending}
    onClick={handleRemove}
    className="text-sm font-medium text-destructive transition-opacity hover:opacity-70 disabled:opacity-40"
  >
    Remove
  </button>
</div>


);
}