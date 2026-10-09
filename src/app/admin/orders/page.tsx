import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { OrderStatusSelect } from "../order-status-select";

export const instant = false;

interface AdminOrdersPageProps {
  searchParams: Promise<{
    date?: string;
    status?: string;
    customer?: string;
    orderId?: string;
    payment?: string;
    delivery?: string;
  }>;
}

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

const DELIVERY_TYPES = [
  "DELIVERY",
  "COLLECTION",
] as const;

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

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
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
   * SEARCH PARAMS
   */

  const params = await searchParams;

  const date = params.date?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const customer = params.customer?.trim() ?? "";
  const orderId = params.orderId?.trim() ?? "";
  const payment = params.payment?.trim() ?? "";
  const delivery = params.delivery?.trim() ?? "";

  /*
   * VALIDATE FILTERS
   */

  const validStatus = ORDER_STATUSES.includes(
    status as (typeof ORDER_STATUSES)[number]
  )
    ? (status as (typeof ORDER_STATUSES)[number])
    : "";

  const validPayment = PAYMENT_STATUSES.includes(
    payment as (typeof PAYMENT_STATUSES)[number]
  )
    ? (payment as (typeof PAYMENT_STATUSES)[number])
    : "";

  const validDelivery = DELIVERY_TYPES.includes(
    delivery as (typeof DELIVERY_TYPES)[number]
  )
    ? (delivery as (typeof DELIVERY_TYPES)[number])
    : "";

  /*
   * DATE FILTER
   */

  let dateFilter:
    | {
        gte?: Date;
        lt?: Date;
      }
    | undefined;

  if (date) {
    const startDate = new Date(`${date}T00:00:00`);

    if (!Number.isNaN(startDate.getTime())) {
      const endDate = new Date(startDate);

      endDate.setDate(endDate.getDate() + 1);

      dateFilter = {
        gte: startDate,
        lt: endDate,
      };
    }
  }

  /*
   * PRISMA WHERE
   */

  const where = {
    AND: [
      ...(validStatus
        ? [
            {
              status: validStatus,
            },
          ]
        : []),

      ...(customer
        ? [
            {
              OR: [
                {
                  customerName: {
                    contains: customer,
                    mode: "insensitive" as const,
                  },
                },
                {
                  customerEmail: {
                    contains: customer,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ]
        : []),

      ...(orderId
        ? [
            {
              OR: [
                {
                  id: {
                    contains: orderId,
                    mode: "insensitive" as const,
                  },
                },
                {
                  orderNumber: {
                    contains: orderId,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ]
        : []),

      ...(validDelivery
        ? [
            {
              deliveryType: validDelivery,
            },
          ]
        : []),

      ...(dateFilter
        ? [
            {
              createdAt: dateFilter,
            },
          ]
        : []),

      ...(validPayment
        ? [
            {
              payment: {
                is: {
                  status: validPayment,
                },
              },
            },
          ]
        : []),
    ],
  };

  /*
   * GET ORDERS
   */

  const orders = await prisma.order.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      payment: true,
      items: true,
    },
  });

  /*
   * FILTER STATE
   */

  const hasFilters = Boolean(
    date ||
      validStatus ||
      customer ||
      orderId ||
      validPayment ||
      validDelivery
  );

  /*
   * RENDER
   */

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Admin
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Orders
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Manage customer orders and update their status.
              </p>
            </div>

            <div className="rounded-xl border bg-card px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {hasFilters ? "Matching orders" : "Total orders"}
              </p>

              <p className="mt-1 text-2xl font-bold">
                {orders.length}
              </p>
            </div>
          </div>

          {/* FILTERS */}

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Filter orders
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Search and filter customer orders.
                </p>
              </div>

              {hasFilters && (
                <Link
                  href="/admin/orders"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Clear filters
                </Link>
              )}
            </div>

            <form
              method="GET"
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium"
                >
                  Date
                </label>

                <input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={date}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue={validStatus}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    All statuses
                  </option>

                  {ORDER_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {formatStatus(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="customer"
                  className="mb-2 block text-sm font-medium"
                >
                  Customer
                </label>

                <input
                  id="customer"
                  name="customer"
                  type="text"
                  defaultValue={customer}
                  placeholder="Name or email"
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="orderId"
                  className="mb-2 block text-sm font-medium"
                >
                  Order ID
                </label>

                <input
                  id="orderId"
                  name="orderId"
                  type="text"
                  defaultValue={orderId}
                  placeholder="Order ID or number"
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="payment"
                  className="mb-2 block text-sm font-medium"
                >
                  Payment
                </label>

                <select
                  id="payment"
                  name="payment"
                  defaultValue={validPayment}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    All payment statuses
                  </option>

                  {PAYMENT_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {formatStatus(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="delivery"
                  className="mb-2 block text-sm font-medium"
                >
                  Delivery
                </label>

                <select
                  id="delivery"
                  name="delivery"
                  defaultValue={validDelivery}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    All fulfilment types
                  </option>

                  <option value="DELIVERY">
                    Delivery
                  </option>

                  <option value="COLLECTION">
                    Collection
                  </option>
                </select>
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Apply filters
                </button>
              </div>
            </form>
          </section>

          {/* ORDERS */}

          <div className="mt-8">
            {orders.length === 0 ? (
              <section className="rounded-2xl border bg-card p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
                  📦
                </div>

                <h2 className="mt-4 text-xl font-semibold">
                  No orders found
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {hasFilters
                    ? "Try changing or clearing your filters."
                    : "Customer orders will appear here once they are placed."}
                </p>

                {hasFilters && (
                  <Link
                    href="/admin/orders"
                    className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Clear filters
                  </Link>
                )}
              </section>
            ) : (
              <div className="overflow-hidden rounded-2xl border bg-card">

                {/* DESKTOP */}

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-secondary/40">
                      <tr>
                        <th className="px-5 py-4 text-left font-semibold">
                          Order
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Customer
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Total
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Payment
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Status
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Fulfilment
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Date
                        </th>

                        <th className="px-5 py-4 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {orders.map((order) => {
                        const total = Number(order.total);

                        const paymentStatus =
                          order.payment?.status ?? "PENDING";

                        return (
                          <tr
                            key={order.id}
                            className="transition-colors hover:bg-secondary/20"
                          >
                            <td className="px-5 py-5 align-top">
                              <p className="font-semibold">
                                #{order.orderNumber}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {order.items.length}{" "}
                                {order.items.length === 1
                                  ? "item"
                                  : "items"}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-[11px] text-muted-foreground">
                                ID: {order.id}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-medium">
                                {order.customerName}
                              </p>

                              <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                                {order.customerEmail}
                              </p>

                              {order.customerPhone && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {order.customerPhone}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-5 align-top font-semibold">
                              €{total.toFixed(2)}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentClasses(
                                  paymentStatus
                                )}`}
                              >
                                {formatStatus(paymentStatus)}
                              </span>

                              {order.payment?.provider && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {order.payment.provider}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                  order.status
                                )}`}
                              >
                                {formatStatus(order.status)}
                              </span>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-medium">
                                {order.deliveryType === "DELIVERY"
                                  ? "Delivery"
                                  : "Collection"}
                              </p>

                              {order.deliveryDate && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {new Intl.DateTimeFormat("en-IE", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }).format(order.deliveryDate)}
                                </p>
                              )}

                              {order.deliverySlot && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {order.deliverySlot}
                                </p>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-5 align-top">
                              <p className="font-medium">
                                {new Intl.DateTimeFormat("en-IE", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }).format(order.createdAt)}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {new Intl.DateTimeFormat("en-IE", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(order.createdAt)}
                              </p>
                            </td>

                            <td className="px-5 py-5 text-right align-top">
                              <div className="flex flex-col items-end gap-3">
                                <OrderStatusSelect
                                  orderId={order.id}
                                  currentStatus={order.status}
                                />

                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className="inline-flex rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
                                >
                                  View order
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}

                <div className="divide-y md:hidden">
                  {orders.map((order) => {
                    const total = Number(order.total);

                    const paymentStatus =
                      order.payment?.status ?? "PENDING";

                    return (
                      <div
                        key={order.id}
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              #{order.orderNumber}
                            </p>

                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {order.customerName}
                            </p>

                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {order.customerEmail}
                            </p>
                          </div>

                          <p className="shrink-0 font-bold">
                            €{total.toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentClasses(
                              paymentStatus
                            )}`}
                          >
                            Payment: {formatStatus(paymentStatus)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>

                          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                            {order.deliveryType === "DELIVERY"
                              ? "Delivery"
                              : "Collection"}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground">
                            Placed
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {new Intl.DateTimeFormat("en-IE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(order.createdAt)}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                          <OrderStatusSelect
                            orderId={order.id}
                            currentStatus={order.status}
                          />

                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
                          >
                            View order
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}