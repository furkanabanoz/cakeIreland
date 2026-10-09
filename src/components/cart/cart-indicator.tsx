"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCartDrawer } from "./cart-drawer-provider";

export function CartIndicator() {
  const { count } = useCartDrawer();

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className="relative rounded-md p-2 hover:bg-accent"
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
