import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomizationSummary } from "@/components/product/customization-summary";

export const instant = false;

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClasses(status: string) {
  switch (status) {
    case "PAID":
    case "CONFIRMED":
      return "bg-green-100 text-green-700";

    case "PREPARING":
    case "READY":
      return "bg-blue-100 text-blue-700";

    case "OUT_FOR_DELIVERY":
      return "bg-purple-100 text-purple-700";

    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";

    case "CANCELLED":
    case "REFUNDED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-primary/10 text-primary";
  }
}

function getPaymentClasses(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "FAILED":
    case "REFUNDED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-secondary text-foreground";
  }
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  /*
   * AUTHENTICATION
   */

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /*
   * AUTHORIZATION
   */

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  /*
   * PARAMS
   */

  const { id } = await params;

  /*
   * FIND ORDER
   */

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      payment: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  /*
   * VALUES
   */

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const deliveryFee = Number(order.deliveryFee);
  const total = Number(order.total);

  const statusLabel = formatStatus(order.status);

  const paymentStatus = order.payment?.status ?? "PENDING";
  const paymentStatusLabel = formatStatus(paymentStatus);

  const placedDate = new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(order.createdAt);

  const deliveryDate = order.deliveryDate
    ? new Intl.DateTimeFormat("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(order.deliveryDate)
    : null;

  /*
   * DELIVERY ADDRESS
   */

  const deliveryAddress =
    order.deliveryAddress &&
    typeof order.deliveryAddress === "object"
      ? (order.deliveryAddress as {
          firstName?: string;
          lastName?: string;
          addressLine1?: string;
          addressLine2?: string | null;
          city?: string;
          county?: string | null;
          eircode?: string | null;
          phone?: string | null;
          deliveryZone?: {
            name?: string;
          } | null;
        })
      : null;

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-6xl">

          {/* BACK */}

          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to orders
          </Link>

          {/* HEADER */}

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Admin
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Order #{order.orderNumber}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Placed on {placedDate}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClasses(
                  order.status
                )}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {/* MAIN */}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">

            {/* LEFT */}

            <div className="space-y-6">

              {/* CUSTOMER */}

              <section className="rounded-2xl border bg-card p-6">
                <h2 className="text-xl font-semibold">
                  Customer
                </h2>

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
                      Phone
                    </p>

                    <p className="mt-1 font-medium">
                      {order.customerPhone || "Not provided"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>

                    <p className="mt-1 break-all font-medium">
                      {order.customerEmail}
                    </p>
                  </div>

                </div>
              </section>

              {/* PRODUCTS */}

              <section className="rounded-2xl border bg-card p-6">
                <h2 className="text-xl font-semibold">
                  Products
                </h2>

                <div className="mt-6 divide-y">
                  {order.items.map((item) => {
                    const itemTotal = Number(item.totalPrice);
                    const unitPrice = Number(item.unitPrice);

                    return (
                      <div
                        key={item.id}
                        className="py-5 first:pt-0 last:pb-0"
                      >
                        <div className="flex gap-4">

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
                              €{unitPrice.toFixed(2)} each
                            </p>
                          </div>

                          <p className="shrink-0 font-semibold">
                            €{itemTotal.toFixed(2)}
                          </p>

                        </div>

                        {item.customization &&
                          typeof item.customization === "object" && (
                            <div className="mt-4 rounded-xl bg-secondary/40 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Customization
                              </p>
                              <CustomizationSummary
                                customization={item.customization}
                                className="mt-3 space-y-2 text-sm"
                              />
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ADDRESS */}

              <section className="rounded-2xl border bg-card p-6">
                <h2 className="text-xl font-semibold">
                  Address
                </h2>

                {order.deliveryType === "DELIVERY" ? (
                  deliveryAddress ? (
                    <div className="mt-6 text-sm leading-6">

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

                      {deliveryAddress.county && (
                        <p>
                          {deliveryAddress.county}
                        </p>
                      )}

                      {deliveryAddress.eircode && (
                        <p className="mt-2 font-semibold">
                          Eircode: {deliveryAddress.eircode}
                        </p>
                      )}

                      {deliveryAddress.deliveryZone?.name && (
                        <p className="mt-2 text-muted-foreground">
                          Delivery area:{" "}
                          {deliveryAddress.deliveryZone.name}
                        </p>
                      )}

                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      No delivery address available.
                    </p>
                  )
                ) : (
                  <div className="mt-4 rounded-xl bg-secondary/40 p-4 text-sm">
                    This order is for collection.
                  </div>
                )}
              </section>

              {/* DELIVERY */}

              <section className="rounded-2xl border bg-card p-6">
                <h2 className="text-xl font-semibold">
                  Delivery
                </h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-3">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Type
                    </p>

                    <p className="mt-1 font-medium">
                      {order.deliveryType === "DELIVERY"
                        ? "Delivery"
                        : "Collection"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Delivery date
                    </p>

                    <p className="mt-1 font-medium">
                      {deliveryDate ?? "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Delivery slot
                    </p>

                    <p className="mt-1 font-medium">
                      {order.deliverySlot ?? "Not specified"}
                    </p>
                  </div>

                </div>
              </section>

              {/* NOTES */}

              <section className="rounded-2xl border bg-card p-6">
                <h2 className="text-xl font-semibold">
                  Notes
                </h2>

                {order.notes ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {order.notes}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No notes for this order.
                  </p>
                )}
              </section>

            </div>

            {/* RIGHT */}

            <aside className="h-fit space-y-6 lg:sticky lg:top-24">

              {/* PAYMENT */}

              <section className="rounded-2xl border bg-secondary/30 p-6">
                <h2 className="text-xl font-semibold">
                  Payment
                </h2>

                <div className="mt-6 space-y-4">

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Provider
                    </span>

                    <span className="font-medium">
                      {order.payment?.provider
                        ? order.payment.provider
                        : "Payment"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentClasses(
                        paymentStatus
                      )}`}
                    >
                      {paymentStatusLabel}
                    </span>
                  </div>

                  {order.payment?.currency && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">
                        Currency
                      </span>

                      <span className="font-medium">
                        {order.payment.currency}
                      </span>
                    </div>
                  )}

                </div>
              </section>

              {/* ORDER SUMMARY */}

              <section className="rounded-2xl border bg-card p-6">
                <h2 className="text-xl font-semibold">
                  Order total
                </h2>

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
              </section>

              {/* ACTIONS */}

              <section className="rounded-2xl border bg-card p-6">
                <h2 className="text-xl font-semibold">
                  Actions
                </h2>

                <div className="mt-5">
                  <Link
                    href="/admin/orders"
                    className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Back to orders
                  </Link>
                </div>
              </section>

            </aside>
          </div>
        </div>
      </Container>
    </main>
  );
}