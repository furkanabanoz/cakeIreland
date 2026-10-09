import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";

import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { Prisma } from "@/generated/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseShopFilters } from "@/lib/shop-filters";

export const instant = false;

export const metadata: Metadata = {
  title: "Shop Cakes",
  description:
    "Shop celebration cakes, cupcakes and desserts made for birthdays and special moments.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: "Shop Cakes | CakeIreland",
    description:
      "Shop celebration cakes, cupcakes and desserts made for birthdays and special moments.",
    url: "/shop",
  },
};

interface ShopPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function ShopPage({
  searchParams,
}: ShopPageProps) {
  await connection();
  const filters = parseShopFilters(await searchParams);
  const session = await auth();
  const productConditions: Prisma.ProductWhereInput[] = [];

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    productConditions.push({
      basePrice: {
        ...(filters.minPrice === undefined ? {} : { gte: filters.minPrice }),
        ...(filters.maxPrice === undefined ? {} : { lte: filters.maxPrice }),
      },
    });
  }
  if (filters.flavours.length > 0) {
    productConditions.push({
      options: {
        some: {
          type: "FLAVOUR",
          values: {
            some: {
              available: true,
              name: { in: filters.flavours, mode: "insensitive" },
            },
          },
        },
      },
    });
  }
  if (filters.sizes.length > 0) {
    productConditions.push({
      options: {
        some: {
          type: "SIZE",
          values: {
            some: {
              available: true,
              name: { in: filters.sizes, mode: "insensitive" },
            },
          },
        },
      },
    });
  }

  const [products, categories, optionGroups] = await Promise.all([
    prisma.product.findMany({
      where: {
        published: true,
        ...(filters.availableOnly ? { available: true } : {}),
        ...(filters.query
          ? {
              OR: [
                {
                  name: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  category: {
                    name: {
                      contains: filters.query,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
        AND: productConditions,
      },
      include: {
        category: true,
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        favorites: {
          where: {
            userId: session?.user?.id ?? "",
          },
          select: {
            userId: true,
          },
        },
        categoryProducts: {
          where: { featured: true },
          select: { categoryId: true },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.category.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    prisma.productOption.findMany({
      where: {
        type: { in: ["FLAVOUR", "SIZE"] },
        product: { published: true },
      },
      select: {
        type: true,
        values: {
          where: { available: true },
          select: { name: true },
        },
      },
    }),
  ]);
  const facets = {
    FLAVOUR: new Set<string>(),
    SIZE: new Set<string>(),
  };
  for (const option of optionGroups) {
    if (option.type !== "FLAVOUR" && option.type !== "SIZE") {
      continue;
    }
    for (const value of option.values) {
      if (value.name.trim()) {
        facets[option.type].add(value.name.trim());
      }
    }
  }

  const sortedProducts = [...products];
  if (filters.sort === "price-low") {
    sortedProducts.sort(
      (left, right) =>
        Number(left.basePrice) - Number(right.basePrice) ||
        left.name.localeCompare(right.name)
    );
  } else if (filters.sort === "price-high") {
    sortedProducts.sort(
      (left, right) =>
        Number(right.basePrice) - Number(left.basePrice) ||
        left.name.localeCompare(right.name)
    );
  } else if (filters.sort === "rating") {
    const averageRating = (ratings: { rating: number }[]) =>
      ratings.length === 0
        ? 0
        : ratings.reduce((sum, review) => sum + review.rating, 0) /
          ratings.length;
    sortedProducts.sort(
      (left, right) =>
        averageRating(right.reviews) - averageRating(left.reviews) ||
        right.reviews.length - left.reviews.length ||
        right.createdAt.getTime() - left.createdAt.getTime()
    );
  } else {
    sortedProducts.sort(
      (left, right) =>
        Number(right.categoryProducts.length > 0) -
          Number(left.categoryProducts.length > 0) ||
        right.createdAt.getTime() - left.createdAt.getTime()
    );
  }
  const flavorValues = [...facets.FLAVOUR].sort((left, right) =>
    left.localeCompare(right)
  );
  const sizeValues = [...facets.SIZE].sort((left, right) =>
    left.localeCompare(right)
  );
  const clearFiltersHref = filters.query
    ? `/shop?q=${encodeURIComponent(filters.query)}`
    : "/shop";

  return (
    <main>
      <section className="border-b bg-secondary/30 py-12">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            CakeIreland
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Shop our cakes
          </h1>

          <p className="mt-4 max-w-2xl text-muted-foreground">
            Discover cakes, cupcakes and desserts made for birthdays,
            celebrations and special moments.
          </p>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          {/* Search */}
          <form
            action="/shop"
            method="GET"
            className="mb-8"
          >
            {filters.minPrice !== undefined && (
              <input
                type="hidden"
                name="minPrice"
                value={filters.minPrice}
              />
            )}
            {filters.maxPrice !== undefined && (
              <input
                type="hidden"
                name="maxPrice"
                value={filters.maxPrice}
              />
            )}
            {filters.flavours.map((flavour) => (
              <input
                key={flavour}
                type="hidden"
                name="flavour"
                value={flavour}
              />
            ))}
            {filters.sizes.map((size) => (
              <input key={size} type="hidden" name="size" value={size} />
            ))}
            {filters.availableOnly && (
              <input type="hidden" name="available" value="1" />
            )}
            {filters.sort !== "featured" && (
              <input type="hidden" name="sort" value={filters.sort} />
            )}
            <div className="flex gap-3">
              <input
                type="search"
                name="q"
                defaultValue={filters.query}
                placeholder="Search cakes..."
                className="h-11 flex-1 rounded-lg border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              <button
                type="submit"
                className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Search
              </button>
            </div>
          </form>

          {/* Active search */}
          {filters.query && (
            <div className="mb-6 flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <p className="text-sm">
                Search results for{" "}
                <span className="font-semibold">
                  &quot;{filters.query}&quot;
                </span>
              </p>

              <Link
                href={clearFiltersHref}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Clear
              </Link>
            </div>
          )}

          <form action="/shop" method="GET">
            {filters.query && (
              <input type="hidden" name="q" value={filters.query} />
            )}
            <div className="flex flex-col gap-8 lg:flex-row">
            {/* Filters */}
            <aside className="w-full shrink-0 lg:w-64">
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-semibold">
                  Filters
                </h2>

                <div className="mt-6">
                  <h3 className="text-sm font-medium">
                    Categories
                  </h3>

                  <div className="mt-3 space-y-3">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/categories/${category.slug}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary hover:text-primary"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-medium">
                    Price
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="minPrice"
                      min="0"
                      step="0.01"
                      aria-label="Minimum price in euro"
                      defaultValue={filters.minPrice}
                      placeholder="Min €"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />

                    <input
                      type="number"
                      name="maxPrice"
                      min="0"
                      step="0.01"
                      aria-label="Maximum price in euro"
                      defaultValue={filters.maxPrice}
                      placeholder="Max €"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </div>
                  {filters.priceRangeError && (
                    <p className="mt-2 text-sm text-destructive" role="alert">
                      Minimum price must not exceed maximum price.
                    </p>
                  )}
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-medium">
                    Flavour
                  </h3>

                  <div className="mt-3 space-y-3">
                    {flavorValues.length > 0 ? flavorValues.map((flavour) => (
                      <label
                        key={flavour}
                        className="flex cursor-pointer items-center gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="flavour"
                          value={flavour}
                          defaultChecked={filters.flavours.includes(flavour)}
                          className="size-4 rounded border"
                        />

                        <span>{flavour}</span>
                      </label>
                    )) : (
                      <p className="text-sm text-muted-foreground">
                        No flavour options are currently available.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-medium">
                    Size
                  </h3>

                  <div className="mt-3 space-y-3">
                    {sizeValues.length > 0 ? sizeValues.map((size) => (
                      <label
                        key={size}
                        className="flex cursor-pointer items-center gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="size"
                          value={size}
                          defaultChecked={filters.sizes.includes(size)}
                          className="size-4 rounded border"
                        />

                        <span>{size}</span>
                      </label>
                    )) : (
                      <p className="text-sm text-muted-foreground">
                        No size options are currently available.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-medium">
                    Availability
                  </h3>

                  <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="available"
                      value="1"
                      defaultChecked={filters.availableOnly}
                      className="size-4 rounded border"
                    />

                    <span>Available products</span>
                  </label>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Apply filters
                  </button>
                  <Link
                    href={clearFiltersHref}
                    className="text-center text-sm font-medium text-primary hover:underline"
                  >
                    Clear filters
                  </Link>
                </div>
              </div>
            </aside>

            {/* Products */}
            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  {sortedProducts.length}{" "}
                  {sortedProducts.length === 1
                    ? "product"
                    : "products"}
                </p>

                <select
                  name="sort"
                  aria-label="Sort products"
                  className="h-10 rounded-lg border bg-background px-3 text-sm"
                  defaultValue={filters.sort}
                >
                  <option value="featured">
                    Featured
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>

                  <option value="rating">
                    Highest Rated
                  </option>
                </select>
                <button
                  type="submit"
                  className="h-10 rounded-lg border px-3 text-sm font-medium hover:bg-secondary"
                >
                  Sort
                </button>
              </div>

              {sortedProducts.length === 0 ? (
                <div className="rounded-2xl border bg-card p-10 text-center">
                  <h2 className="text-xl font-semibold">
                    No cakes found
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Try searching for another cake.
                  </p>

                  <Link
                    href={clearFiltersHref}
                    className="mt-5 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    View all cakes
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      productId={product.id}
                      name={product.name}
                      price={Number(product.basePrice)}
                      href={`/cakes/${product.slug}`}
                      image={product.images[0]?.url}
                      initiallyFavorited={
                        product.favorites.length > 0
                      }
                      authenticated={Boolean(
                        session?.user?.id
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          </form>
        </Container>
      </section>
    </main>
  );
}
