import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminProductsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      category: {
        select: {
          name: true,
        },
      },

      images: {
        where: {
          isPrimary: true,
        },

        take: 1,
      },

      options: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  function formatOptionType(type: string) {
    return type
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Admin
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Products
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Create and manage your cake products.
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex w-fit rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              + Create product
            </Link>
          </div>

          {/* Product count */}

          <div className="mt-8 rounded-xl border bg-card px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total products
            </p>

            <p className="mt-1 text-2xl font-bold">
              {products.length}
            </p>
          </div>

          {/* Products */}

          <div className="mt-6">
            {products.length === 0 ? (
              <section className="rounded-2xl border bg-card p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
                  🎂
                </div>

                <h2 className="mt-4 text-xl font-semibold">
                  No products yet
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first product to start selling.
                </p>

                <Link
                  href="/admin/products/new"
                  className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Create product
                </Link>
              </section>
            ) : (
              <div className="overflow-hidden rounded-2xl border bg-card">
                {/* Desktop */}

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-secondary/40">
                      <tr>
                        <th className="px-5 py-4 text-left font-semibold">
                          Product
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Category
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Price
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Options
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Status
                        </th>

                        <th className="px-5 py-4 text-left font-semibold">
                          Preparation
                        </th>

                        <th className="px-5 py-4 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {products.map((product) => {
                        const primaryImage =
                          product.images[0]?.url;

                        return (
                          <tr
                            key={product.id}
                            className="transition-colors hover:bg-secondary/20"
                          >
                            {/* Product */}

                            <td className="px-5 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                                  {primaryImage ? (
                                    <img
                                      src={primaryImage}
                                      alt={
                                        product.name
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xl">
                                      🎂
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="font-semibold">
                                    {product.name}
                                  </p>

                                  <p className="mt-1 max-w-[240px] truncate text-xs text-muted-foreground">
                                    /{product.slug}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}

                            <td className="px-5 py-5">
                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                {product.category.name}
                              </span>
                            </td>

                            {/* Price */}

                            <td className="px-5 py-5 font-semibold">
                              €
                              {Number(
                                product.basePrice
                              ).toFixed(2)}
                            </td>

                            {/* Options */}

                            <td className="px-5 py-5">
                              {product.options.length ===
                              0 ? (
                                <span className="text-xs text-muted-foreground">
                                  None
                                </span>
                              ) : (
                                <div className="flex max-w-[220px] flex-wrap gap-1.5">
                                  {product.options.map(
                                    (option) => (
                                      <span
                                        key={
                                          option.id
                                        }
                                        className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                                      >
                                        {formatOptionType(
                                          option.type
                                        )}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Status */}

                            <td className="px-5 py-5">
                              <div className="flex flex-col gap-2">
                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                    product.published
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {product.published
                                    ? "Published"
                                    : "Unpublished"}
                                </span>

                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                    product.available
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {product.available
                                    ? "Available"
                                    : "Unavailable"}
                                </span>
                              </div>
                            </td>

                            {/* Preparation */}

                            <td className="px-5 py-5 whitespace-nowrap">
                              {product.preparationTime} min
                            </td>

                            {/* Actions */}

                            <td className="px-5 py-5 text-right">
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="inline-flex rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}

                <div className="divide-y md:hidden">
                  {products.map((product) => {
                    const primaryImage =
                      product.images[0]?.url;

                    return (
                      <div
                        key={product.id}
                        className="p-5"
                      >
                        <div className="flex gap-4">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xl">
                                🎂
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold">
                                  {product.name}
                                </p>

                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  /{product.slug}
                                </p>
                              </div>

                              <p className="shrink-0 font-bold">
                                €
                                {Number(
                                  product.basePrice
                                ).toFixed(2)}
                              </p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                {product.category.name}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  product.published
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {product.published
                                  ? "Published"
                                  : "Unpublished"}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  product.available
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {product.available
                                  ? "Available"
                                  : "Unavailable"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Preparation
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {product.preparationTime} min
                            </p>
                          </div>

                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
                          >
                            Edit product
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