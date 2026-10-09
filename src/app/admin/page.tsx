import Link from "next/link";
import { connection } from "next/server";

import { Container } from "@/components/container";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminPage() {
  /*
  |--------------------------------------------------------------------------
  | TODAY
  |--------------------------------------------------------------------------
  */

  await connection();

const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(
    startOfTomorrow.getDate() + 1
  );

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD DATA
  |--------------------------------------------------------------------------
  */

  const [
    todaysSalesResult,
    todaysOrders,
    pendingOrders,
    preparingOrders,
    readyOrders,
    deliveredOrders,
    recentOrders,
  ] = await Promise.all([
    /*
    |--------------------------------------------------------------------------
    | TODAY'S SALES
    |--------------------------------------------------------------------------
    */

    prisma.order.aggregate({
      _sum: {
        total: true,
      },

      where: {
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },

        status: {
          notIn: [
            "PENDING",
            "CANCELLED",
            "REFUNDED",
          ],
        },
      },
    }),

    /*
    |--------------------------------------------------------------------------
    | TODAY'S ORDERS
    |--------------------------------------------------------------------------
    */

    prisma.order.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    }),

    /*
    |--------------------------------------------------------------------------
    | PENDING
    |--------------------------------------------------------------------------
    */

    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),

    /*
    |--------------------------------------------------------------------------
    | PREPARING
    |--------------------------------------------------------------------------
    */

    prisma.order.count({
      where: {
        status: "PREPARING",
      },
    }),

    /*
    |--------------------------------------------------------------------------
    | READY
    |--------------------------------------------------------------------------
    */

    prisma.order.count({
      where: {
        status: "READY",
      },
    }),

    /*
    |--------------------------------------------------------------------------
    | DELIVERED
    |--------------------------------------------------------------------------
    */

    prisma.order.count({
      where: {
        status: "DELIVERED",
      },
    }),

    /*
    |--------------------------------------------------------------------------
    | RECENT ORDERS
    |--------------------------------------------------------------------------
    */

    prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 8,

      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        total: true,
        status: true,
        deliveryType: true,
        createdAt: true,
      },
    }),
  ]);

  const todaysSales = Number(
    todaysSalesResult._sum.total ?? 0
  );

  /*
  |--------------------------------------------------------------------------
  | STATUS LABEL
  |--------------------------------------------------------------------------
  */

  function formatStatus(status: string) {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-7xl">
          {/* Header */}

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Monitor today&apos;s sales, orders and fulfilment.
            </p>
          </div>

          {/* Main statistics */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Today's Sales */}

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Today&apos;s Sales
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    €{todaysSales.toFixed(2)}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-xl">
                  €
                </div>
              </div>
            </div>

            {/* Today's Orders */}

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Today&apos;s Orders
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {todaysOrders}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl">
                  📦
                </div>
              </div>
            </div>

            {/* Pending */}

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {pendingOrders}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-xl">
                  ⏳
                </div>
              </div>
            </div>

            {/* Preparing */}

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Preparing
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {preparingOrders}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  👨‍🍳
                </div>
              </div>
            </div>

            {/* Ready */}

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ready
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {readyOrders}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
                  ✅
                </div>
              </div>
            </div>

            {/* Delivered */}

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Delivered
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {deliveredOrders}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-xl">
                  🚚
                </div>
              </div>
            </div>
          </div>

          {/* Recent orders */}

          <section className="mt-8 overflow-hidden rounded-2xl border bg-card">
            <div className="flex flex-col gap-3 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Recent Orders
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  The latest customer orders.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/orders"
                  className="inline-flex w-fit rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  View all orders
                </Link>
                <Link
                  href="/admin/reviews"
                  className="inline-flex w-fit rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Moderate reviews
                </Link>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
                  📦
                </div>

                <h3 className="mt-4 font-semibold">
                  No orders yet
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Customer orders will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          #{order.orderNumber}
                        </p>

                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {formatStatus(order.status)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-medium">
                        {order.customerName}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {order.customerEmail}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.deliveryType === "DELIVERY"
                          ? "Delivery"
                          : "Collection"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      <div className="text-right">
                        <p className="font-bold">
                          €{Number(order.total).toFixed(2)}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat(
                            "en-IE",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          ).format(order.createdAt)}
                        </p>
                      </div>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}