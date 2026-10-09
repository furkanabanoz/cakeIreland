import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function FavoritesPage() {
  await connection();

  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        "/account/favorites"
      )}`
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      product: {
        published: true,
      },
    },
    include: {
      product: {
        include: {
          images: {
            where: {
              isPrimary: true,
            },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            My Account
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            My favorites
          </h1>

          {favorites.length === 0 ? (
            <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
              <p className="font-medium">
                You have not saved any products yet.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Browse cakes
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {favorites.map(({ product }) => (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  name={product.name}
                  price={Number(product.basePrice)}
                  href={`/cakes/${product.slug}`}
                  image={product.images[0]?.url}
                  initiallyFavorited
                  authenticated
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
