import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { PaymentStatusRefresh } from "@/components/account/payment-status-refresh";
import { EventTracker } from "@/components/analytics/event-tracker";
import { Container } from "@/components/container";
import { CustomizationSummary } from "@/components/product/customization-summary";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    payment?: string;
  }>;
}

type DeliveryAddress = {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  eircode?: string | null;
  phone?: string | null;
  deliveryZone?: {
    id?: string;
    name?: string;
  } | null;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function OrderPageLoading() {
  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-32 rounded bg-secondary" />
            <div className="h-10 w-72 rounded bg-secondary" />

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <div className="h-64 rounded-2xl bg-secondary" />
                <div className="h-48 rounded-2xl bg-secondary" />
                <div className="h-40 rounded-2xl bg-secondary" />
              </div>

              <div className="h-80 rounded-2xl bg-secondary" />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

async function OrderContent({
  params,
  searchParams,
}: OrderPageProps) {
  /*
  |--------------------------------------------------------------------------
  | NEXT.JS CACHE COMPONENTS
  |--------------------------------------------------------------------------
  |
  | This page uses request-specific data:
  | - auth()
  | - Prisma
  | - the logged-in user's order
  |
  | With cacheComponents enabled, we must explicitly tell
  | Next.js that this part of the render depends on the request.
  |
  | Do NOT use:
  |
  | export const dynamic = "force-dynamic";
  |
  | because that is incompatible with cacheComponents.
  |--------------------------------------------------------------------------
  */

  await connection();

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const { payment } = await searchParams;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: session.user.id,
    },

    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },

      payment: true,
    },
  });

  if (!order) {
    notFound();
  }

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const deliveryFee = Number(order.deliveryFee);
  const total = Number(order.total);

  const deliveryDate = order.deliveryDate
    ? new Intl.DateTimeFormat("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(order.deliveryDate)
    : null;

  const placedDate = new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.createdAt);

  const statusLabel = formatStatus(order.status);

  const paymentStatus =
    order.payment?.status ?? "PENDING";

  const paymentStatusLabel =
    formatStatus(paymentStatus);

  const isPaymentSuccess =
    payment === "success" &&
    paymentStatus === "PAID";

  const firstItem = order.items[0];

  const deliveryAddress =
    order.deliveryAddress &&
    typeof order.deliveryAddress === "object"
      ? (order.deliveryAddress as DeliveryAddress)
      : null;

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      {paymentStatus === "PAID" && (
        <EventTracker
          eventName="purchase"
          eventKey={`purchase:${order.id}`}
          parameters={{
            transaction_id: order.orderNumber,
            currency: "EUR",
            value: total,
            items: order.items.map((item) => ({
              item_id: item.productId,
              item_name: item.productName,
              price: Number(item.unitPrice),
              quantity: item.quantity,
            })),
          }}
        />
      )}
      <Container>
        <div className="mx-auto max-w-5xl">
          {isPaymentSuccess && (
            <section className="mb-8 overflow-hidden rounded-3xl border bg-card shadow-sm">
              <div className="bg-primary/5 px-6 py-10 text-center sm:px-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                  ✓
                </div>

                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Order confirmed
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Thank you!
                </h1>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Your payment has been received and your
                  order has been successfully confirmed.
                </p>

                <div className="mx-auto mt-6 inline-flex rounded-full bg-background px-5 py-2.5 text-sm font-bold shadow-sm">
                  Order #{order.orderNumber}
                </div>
              </div>

              <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Product
                  </p>

                  <p className="mt-2 font-semibold">
                    {firstItem?.productName ?? "Order"}
                  </p>

                  {order.items.length > 1 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      + {order.items.length - 1} more item
                      {order.items.length - 1 === 1
                        ? ""
                        : "s"}
                    </p>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Delivery date
                  </p>

                  <p className="mt-2 font-semibold">
                    {deliveryDate ?? "Not specified"}
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Delivery time
                  </p>

                  <p className="mt-2 font-semibold">
                    {order.deliverySlot ?? "Not specified"}
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    €{total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t bg-secondary/20 p-5 sm:flex-row sm:justify-center">
                <Link
                  href="/account/orders"
                  className="flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  View My Orders
                </Link>

                <Link
                  href="/shop"
                  className="flex items-center justify-center rounded-xl border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Continue Shopping
                </Link>
              </div>
            </section>
          )}

          <Link
            href="/account/orders"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to orders
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              My Order
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Order #{order.orderNumber}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Placed on {placedDate}
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <section className="rounded-2xl border bg-card p-6">
                <h3 className="text-xl font-semibold">
                  Order items
                </h3>

                <div className="mt-6 divide-y">
                  {order.items.map((item) => {
                    const itemTotal =
                      Number(item.totalPrice);

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 py-5 first:pt-0 last:pb-0"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl">
                          🍰
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {item.productName}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            €{Number(item.unitPrice).toFixed(2)} each
                          </p>
                          <CustomizationSummary
                            customization={item.customization}
                            className="mt-2 space-y-1 text-sm text-muted-foreground"
                          />
                        </div>

                        <p className="font-semibold">
                          €{itemTotal.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-6">
                <h3 className="text-xl font-semibold">
                  Delivery details
                </h3>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Fulfilment
                    </p>

                    <p className="mt-1 font-medium">
                      {order.deliveryType ===
                      "DELIVERY"
                        ? "Delivery"
                        : "Collection"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Date
                    </p>

                    <p className="mt-1 font-medium">
                      {deliveryDate ?? "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Time
                    </p>

                    <p className="mt-1 font-medium">
                      {order.deliverySlot ??
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {order.deliveryType === "DELIVERY" &&
                  deliveryAddress && (
                    <div className="mt-6 border-t pt-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Delivery address
                      </p>

                      <div className="mt-2 text-sm leading-6">
                        {(deliveryAddress.firstName ||
                          deliveryAddress.lastName) && (
                          <p className="font-medium">
                            {deliveryAddress.firstName}{" "}
                            {deliveryAddress.lastName}
                          </p>
                        )}

                        {deliveryAddress.addressLine1 && (
                          <p>
                            {deliveryAddress.addressLine1}
                          </p>
                        )}

                        {deliveryAddress.addressLine2 && (
                          <p>
                            {deliveryAddress.addressLine2}
                          </p>
                        )}

                        {deliveryAddress.city && (
                          <p>
                            {deliveryAddress.city}
                          </p>
                        )}

                        {deliveryAddress.eircode && (
                          <p>
                            {deliveryAddress.eircode}
                          </p>
                        )}

                        {deliveryAddress.deliveryZone
                          ?.name && (
                          <p className="mt-2 text-muted-foreground">
                            Delivery area:{" "}
                            {
                              deliveryAddress
                                .deliveryZone.name
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}
              </section>

              <section className="rounded-2xl border bg-card p-6">
                <h3 className="text-xl font-semibold">
                  Customer details
                </h3>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Name
                    </p>

                    <p className="mt-1 font-medium">
                      {order.customerName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>

                    <p className="mt-1 break-all font-medium">
                      {order.customerEmail}
                    </p>
                  </div>

                  {order.customerPhone && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Phone
                      </p>

                      <p className="mt-1 font-medium">
                        {order.customerPhone}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {order.notes && (
                <section className="rounded-2xl border bg-card p-6">
                  <h3 className="text-xl font-semibold">
                    Order notes
                  </h3>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {order.notes}
                  </p>
                </section>
              )}
            </div>

            <aside className="h-fit rounded-2xl border bg-secondary/30 p-6 lg:sticky lg:top-24">
              <h3 className="text-xl font-semibold">
                Order summary
              </h3>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    €{subtotal.toFixed(2)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Discount
                    </span>

                    <span className="font-medium text-green-600">
                      -€{discount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Delivery
                  </span>

                  <span className="font-medium">
                    {deliveryFee > 0
                      ? `€${deliveryFee.toFixed(2)}`
                      : "Free"}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">
                      Total
                    </span>

                    <span className="text-2xl font-bold">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Payment
                </p>

                {paymentStatus === "FAILED" && (
                  <p
                    role="status"
                    className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                  >
                    This payment was not completed. Your order has not been
                    confirmed. Please contact support if you believe you were
                    charged.
                  </p>
                )}

                {payment === "cancelled" &&
                  paymentStatus === "PENDING" && (
                    <p
                      role="status"
                      className="mt-3 rounded-lg border bg-secondary/40 p-3 text-sm text-muted-foreground"
                    >
                      Checkout was cancelled before we received payment. This
                      order is not confirmed; please contact support if you
                      need help placing it again.
                    </p>
                  )}

                {paymentStatus === "PENDING" &&
                  payment !== "cancelled" && (
                  <p
                    role="status"
                    className="mt-3 rounded-lg border bg-secondary/40 p-3 text-sm text-muted-foreground"
                  >
                    We are waiting for payment confirmation. This may take a
                    short time; you can safely refresh this page.
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {order.payment?.provider ===
                    "stripe"
                      ? "Stripe"
                      : order.payment?.provider ??
                        "Payment"}
                  </span>

                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                    {paymentStatusLabel}
                  </span>
                </div>

                <PaymentStatusRefresh
                  enabled={
                    payment === "success" &&
                    paymentStatus === "PENDING"
                  }
                />
              </div>

              <Link
                href="/shop"
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  return (
    <Suspense fallback={<OrderPageLoading />}>
      <OrderContent
        params={params}
        searchParams={searchParams}
      />
    </Suspense>
  );
}