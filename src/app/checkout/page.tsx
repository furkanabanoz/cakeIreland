import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

import { Container } from "@/components/container";
import { getCart } from "@/actions/cart";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/analytics/checkout-form";
import { EventTracker } from "@/components/analytics/event-tracker";
import { CheckoutStateProvider } from "@/components/checkout/checkout-state";
import { FulfillmentFields } from "@/components/checkout/fulfillment-fields";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";

export const instant = false;

export const metadata: Metadata = {
  title: "Checkout",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent("/checkout")}`
    );
  }

  const cart = await getCart();

  if (!cart) {
    redirect("/cart");
  }

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  /*
  |--------------------------------------------------------------------------
  | DELIVERY ZONES
  |--------------------------------------------------------------------------
  */

  const deliveryZones =
    await prisma.deliveryZone.findMany({
      where: {
        active: true,
      },
      orderBy: {
        fee: "asc",
      },
    });

  /*
  |--------------------------------------------------------------------------
  | DELIVERY SLOTS
  |--------------------------------------------------------------------------
  */

  const deliverySlots =
    await prisma.deliverySlot.findMany({
      where: {
        active: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

  const collectionSlots =
    await prisma.collectionSlot.findMany({
      where: {
        active: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

  /*
  |--------------------------------------------------------------------------
  | SUBTOTAL
  |--------------------------------------------------------------------------
  */

  const subtotal = cart.items.reduce(
    (total, item) =>
      total +
      Number(item.unitPrice) * item.quantity,
    0
  );

  /*
  |--------------------------------------------------------------------------
  | COUPON ITEMS
  |--------------------------------------------------------------------------
  */

  const couponItems = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    product: {
      categoryId: item.product.categoryId,
    },
  }));

  return (
    <main>
      <EventTracker
        eventName="begin_checkout"
        parameters={{
          currency: "EUR",
          value: subtotal,
          items: cart.items.map((item) => ({
            item_id: item.productId,
            item_name: item.product.name,
            price: Number(item.unitPrice),
            quantity: item.quantity,
          })),
        }}
      />
      <section className="py-8 sm:py-12">
        <Container>
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                CakeIreland
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                Checkout
              </h1>

              <p className="mt-3 text-muted-foreground">
                Choose how and when you would like
                to receive your order.
              </p>
            </div>

            <CheckoutForm className="mt-10">
              <CheckoutStateProvider>
                <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="space-y-6">
                {/* Customer Details */}
                <section className="rounded-2xl border bg-background p-6">
                  <h2 className="text-xl font-bold">
                    Customer details
                  </h2>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="text-sm font-medium"
                      >
                        First name
                      </label>

                      <input
                        id="firstName"
                        name="firstName"
                        required
                        className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="text-sm font-medium"
                      >
                        Last name
                      </label>

                      <input
                        id="lastName"
                        name="lastName"
                        required
                        className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="text-sm font-medium"
                      >
                        Email
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={
                          session.user.email ?? ""
                        }
                        required
                        className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="text-sm font-medium"
                      >
                        Phone
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </section>

                <FulfillmentFields
                  deliveryZones={deliveryZones.map((zone) => ({
                    id: zone.id,
                    name: zone.name,
                    description: zone.description,
                    fee: Number(zone.fee),
                  }))}
                  deliverySlots={deliverySlots.map((slot) => ({
                    id: slot.id,
                    name: slot.name,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                  }))}
                  collectionSlots={collectionSlots.map((slot) => ({
                    id: slot.id,
                    name: slot.name,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                  }))}
                />

                {/* Notes */}
                <section className="rounded-2xl border bg-background p-6">
                  <h2 className="text-xl font-bold">
                    Order notes
                  </h2>

                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Any special instructions?"
                    className="mt-5 w-full resize-none rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </section>
              </div>

              <CheckoutSummary
                items={cart.items.map((item) => ({
                  id: item.id,
                  name: item.product.name,
                  quantity: item.quantity,
                  unitPrice: Number(item.unitPrice),
                }))}
                couponItems={couponItems}
                subtotal={subtotal}
              />
                </div>
              </CheckoutStateProvider>
            </CheckoutForm>
          </div>
        </Container>
      </section>
    </main>
  );
}