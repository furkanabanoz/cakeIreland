import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function AccountLoading() {
  return (
    <main className="min-h-[70vh] py-12">
      <Container>
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-4 w-24 rounded bg-secondary" />

          <div className="mt-3 h-10 w-64 rounded bg-secondary" />

          <div className="mt-3 h-5 w-96 max-w-full rounded bg-secondary" />
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="h-36 rounded-2xl border bg-card" />
          <div className="h-36 rounded-2xl border bg-card" />
          <div className="h-36 rounded-2xl border bg-card" />
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-2xl border bg-card" />
          <div className="h-72 rounded-2xl border bg-card" />
        </div>
      </Container>
    </main>
  );
}

async function AccountContent() {
  // Auth + Prisma runtime data.
  // Bu sayfanın prerender edilmesini engeller.
  await connection();

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          addresses: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-[70vh] py-12">
      <Container>
        <div className="mx-auto max-w-5xl">
          {/* HEADER */}

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              My Account
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome{user.name ? `, ${user.name}` : ""}
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage your account, orders and addresses.
            </p>
          </div>

          {/* STATS */}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* ORDERS */}

            <div className="rounded-2xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Orders
              </p>

              <p className="mt-2 text-3xl font-bold">
                {user._count.orders}
              </p>

              <Link
                href="/account/orders"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                View orders →
              </Link>
            </div>

            {/* FAVORITES */}

            <div className="rounded-2xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Favorites
              </p>

              <p className="mt-2 text-3xl font-bold">
                {user._count.favorites}
              </p>

              <Link
                href="/account/favorites"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                View favorites →
              </Link>
            </div>

            {/* ADDRESSES */}

            <div className="rounded-2xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Addresses
              </p>

              <p className="mt-2 text-3xl font-bold">
                {user._count.addresses}
              </p>

              <Link
                href="/account/addresses"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Manage addresses →
              </Link>
            </div>

            {/* ACCOUNT TYPE */}

            <div className="rounded-2xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Account type
              </p>

              <p className="mt-2 text-3xl font-bold capitalize">
                {user.role.toLowerCase()}
              </p>

              <Link
                href="/account/settings"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Account settings →
              </Link>
            </div>
          </div>

          {/* LOWER CONTENT */}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* PROFILE */}

            <section className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Profile
                </h2>

                <Link
                  href="/account/settings"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {/* NAME */}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name
                  </p>

                  <p className="mt-1 text-sm">
                    {user.name || "Not provided"}
                  </p>
                </div>

                {/* EMAIL */}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm">
                    {user.email}
                  </p>
                </div>

                {/* PHONE */}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Phone
                  </p>

                  <p className="mt-1 text-sm">
                    {user.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            {/* QUICK LINKS */}

            <section className="rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-semibold">
                Quick links
              </h2>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/account/orders"
                  className="rounded-xl border p-4 transition-colors hover:bg-secondary"
                >
                  <p className="font-medium">
                    My Orders
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    View your previous and current orders.
                  </p>
                </Link>

                <Link
                  href="/account/favorites"
                  className="rounded-xl border p-4 transition-colors hover:bg-secondary"
                >
                  <p className="font-medium">
                    My Favorites
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Find the cakes you have saved.
                  </p>
                </Link>

                <Link
                  href="/account/addresses"
                  className="rounded-xl border p-4 transition-colors hover:bg-secondary"
                >
                  <p className="font-medium">
                    My Addresses
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your delivery addresses.
                  </p>
                </Link>

                <Link
                  href="/account/settings"
                  className="rounded-xl border p-4 transition-colors hover:bg-secondary"
                >
                  <p className="font-medium">
                    Settings
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your account information.
                  </p>
                </Link>

                <Link
                  href="/account/privacy"
                  className="rounded-xl border p-4 transition-colors hover:bg-secondary"
                >
                  <p className="font-medium">Privacy and data</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Download your data or manage your privacy choices.
                  </p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountContent />
    </Suspense>
  );
}