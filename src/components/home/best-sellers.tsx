import Link from "next/link";
import { connection } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";

export async function BestSellers() {
  await connection();
  const session = await auth();
  const products = await prisma.product.findMany({
    where: {
      published: true,
      available: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 4,
    include: {
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
    },
  });

  return (
    <section className="bg-secondary/30 py-16">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Customer favourites
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Best sellers
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden text-sm font-semibold text-primary hover:underline sm:block"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
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
              authenticated={Boolean(session?.user?.id)}
            />
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            href="/shop"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all cakes →
          </Link>
        </div>
      </Container>
    </section>
  );
}
