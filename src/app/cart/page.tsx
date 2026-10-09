import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { getCart } from "@/actions/cart";
import { CartItemControls } from "../cart/cart-item-controls";
import { CustomizationSummary } from "@/components/product/customization-summary";

export const instant = false;

export const metadata: Metadata = {
  title: "Your Cart",
  robots: {
    index: false,
    follow: false,
  },
};

function formatPrice(value: number) {
  return `€${value.toFixed(2)}`;
}

export default async function CartPage() {
  /*
   * This page uses authenticated user data and cart data.
   * connection() tells Next.js not to prerender this route.
   */
  await connection();

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fcart");
  }

  const cart = await getCart();

  /*
   * NO CART
   */

  if (!cart) {
    return (
      <main>
        <section className="py-16 sm:py-24">
          <Container>
            <div className="mx-auto max-w-xl text-center">
              <div className="text-6xl">🛒</div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight">
                Your cart is empty
              </h1>

              <p className="mt-3 text-muted-foreground">
                Looks like you haven&apos;t added any cakes yet.
              </p>

              <Link
                href="/shop"
                className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue Shopping
              </Link>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  /*
   * EMPTY CART
   */

  if (cart.items.length === 0) {
    return (
      <main>
        <section className="py-16 sm:py-24">
          <Container>
            <div className="mx-auto max-w-xl text-center">
              <div className="text-6xl">🛒</div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight">
                Your cart is empty
              </h1>

              <p className="mt-3 text-muted-foreground">
                Looks like you haven&apos;t added any cakes yet.
              </p>

              <Link
                href="/shop"
                className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue Shopping
              </Link>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  /*
   * SUBTOTAL
   */

  const subtotal = cart.items.reduce(
    (total, item) =>
      total + Number(item.unitPrice) * item.quantity,
    0
  );

  return (
    <main>
      <section className="py-8 sm:py-12">
        <Container>
          <div className="mx-auto max-w-6xl">
            {/* HEADER */}

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                CakeIreland
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                Your Cart
              </h1>

              <p className="mt-3 text-muted-foreground">
                Review your cakes and customizations before checkout.
              </p>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
              {/* CART ITEMS */}

              <div className="space-y-4">
                {cart.items.map((item) => {
                  const image = item.product.images[0]?.url;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-background p-4 sm:p-5"
                    >
                      <div className="flex gap-4">
                        {/* PRODUCT IMAGE */}

                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-accent/40">
                          {image ? (
                            <Image
                              src={image}
                              alt={item.product.name}
                              fill
                              unoptimized={!image.startsWith("/")}
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-4xl">
                              🍰
                            </div>
                          )}
                        </div>

                        {/* PRODUCT INFO */}

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/cakes/${item.product.slug}`}
                            className="font-semibold hover:text-primary"
                          >
                            {item.product.name}
                          </Link>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatPrice(Number(item.unitPrice))} each
                          </p>

                          {/* CUSTOMIZATION */}

                          <CustomizationSummary
                            customization={item.customization}
                          />

                          {/* PRODUCT AVAILABILITY */}

                          {!item.product.available && (
                            <p className="mt-3 text-sm font-medium text-destructive">
                              This product is currently unavailable.
                            </p>
                          )}
                        </div>

                        {/* ITEM TOTAL */}

                        <div className="text-right">
                          <p className="font-bold">
                            {formatPrice(
                              Number(item.unitPrice) * item.quantity
                            )}
                          </p>
                        </div>
                      </div>

                      {/* QUANTITY CONTROLS */}

                      <div className="mt-5 border-t pt-4">
                        <CartItemControls
                          cartItemId={item.id}
                          quantity={item.quantity}
                          productId={item.productId}
                          productName={item.product.name}
                          unitPrice={Number(item.unitPrice)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SUMMARY */}

              <aside className="h-fit rounded-2xl border bg-secondary/30 p-6 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4 text-sm">
                  {/* SUBTOTAL */}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Subtotal
                    </span>

                    <span className="font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {/* DELIVERY */}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Delivery
                    </span>

                    <span className="font-medium">
                      Calculated at checkout
                    </span>
                  </div>

                  {/* TOTAL */}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold">
                        Total
                      </span>

                      <span className="text-2xl font-bold">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CHECKOUT */}

                <Link
                  href="/checkout"
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Proceed to Checkout
                </Link>

                {/* CONTINUE SHOPPING */}

                <Link
                  href="/shop"
                  className="mt-3 flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  Continue Shopping
                </Link>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Your final delivery fee will be calculated at
                  checkout.
                </p>
              </aside>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}