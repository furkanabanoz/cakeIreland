import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { canPreviewUnpublishedCategories } from "@/lib/category-access";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";

export const instant = false;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

async function getCategoryProducts(categoryId: string, userId?: string) {
  return prisma.categoryProduct.findMany({
    where: {
      categoryId,
      product: { published: true },
    },
    orderBy: [{ sortOrder: "asc" }, { productId: "asc" }],
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          favorites: {
            where: { userId: userId ?? "" },
            select: { userId: true },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });
}

function categoryDescription(category: {
  seoDescription: string | null;
  description: string | null;
  heroSubtitle: string | null;
  name: string;
}) {
  const value =
    category.seoDescription?.trim() ||
    category.description?.trim() ||
    category.heroSubtitle?.trim() ||
    `Explore ${category.name.toLowerCase()} from CakeIreland.`;
  return value.slice(0, 300);
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      published: true,
      description: true,
      heroSubtitle: true,
      heroTitle: true,
      heroImage: true,
      seoTitle: true,
      seoDescription: true,
    },
  });

  if (!category) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  if (
    !category.published &&
    !(await canPreviewUnpublishedCategories())
  ) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const title =
    category.seoTitle?.trim() ||
    category.heroTitle?.trim() ||
    category.name;
  const description = categoryDescription(category);
  const url = `/categories/${category.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(category.published
      ? {}
      : { robots: { index: false, follow: false } }),
    openGraph: {
      type: "website",
      title,
      description,
      url,
      ...(category.heroImage
        ? {
            images: [
              {
                url: category.heroImage,
                alt: category.heroTitle || category.name,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  await connection();
  const { slug } = await params;
  const [session, category] = await Promise.all([
    auth(),
    prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        heroTitle: true,
        heroSubtitle: true,
        heroImage: true,
        ctaText: true,
        ctaLink: true,
        published: true,
      },
    }),
  ]);

  if (!category) {
    notFound();
  }

  let isAdmin = false;
  if (!category.published) {
    isAdmin = session?.user?.id
      ? await canPreviewUnpublishedCategories(session.user.id)
      : false;
    if (!isAdmin) {
      notFound();
    }
  }

  const categoryProducts = await getCategoryProducts(
    category.id,
    session?.user?.id
  );
  const featuredProducts = categoryProducts.filter(
    (entry) => entry.featured
  );
  const productUrl = absoluteUrl(`/categories/${category.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: absoluteUrl("/shop"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: productUrl,
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {!category.published && isAdmin && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
          Admin preview · This category is unpublished and visible only to admins.{" "}
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="underline underline-offset-2"
          >
            Edit category
          </Link>
        </div>
      )}

      <section className="border-b bg-secondary/30">
        <Container className="py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span aria-hidden="true" className="px-2">
              /
            </span>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
            <span aria-hidden="true" className="px-2">
              /
            </span>
            <span aria-current="page" className="text-foreground">
              {category.name}
            </span>
          </nav>

          <div className="mt-7 grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                CakeIreland · Category
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                {category.heroTitle || category.name}
              </h1>
              {(category.heroSubtitle || category.description) && (
                <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-7 text-muted-foreground">
                  {category.heroSubtitle || category.description}
                </p>
              )}
              <Link
                href={category.ctaLink || "/shop"}
                className="mt-7 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {category.ctaText || "Shop all cakes"}
              </Link>
            </div>

            {category.heroImage && (
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-secondary">
                <Image
                  src={category.heroImage}
                  alt={category.heroTitle || category.name}
                  fill
                  priority
                  unoptimized={!category.heroImage.startsWith("/")}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </Container>
      </section>

      {featuredProducts.length > 0 && (
        <section className="border-b py-12 sm:py-16">
          <Container>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Handpicked
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Featured {category.name.toLowerCase()}
              </h2>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map(({ product }) => (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  name={product.name}
                  price={Number(product.basePrice)}
                  href={`/cakes/${product.slug}`}
                  image={product.images[0]?.url}
                  initiallyFavorited={product.favorites.length > 0}
                  authenticated={Boolean(session?.user?.id)}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="py-12 sm:py-16">
        <Container>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Explore the collection
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                All {category.name.toLowerCase()}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {categoryProducts.length}{" "}
              {categoryProducts.length === 1 ? "product" : "products"}
            </p>
          </div>

          {categoryProducts.length === 0 ? (
            <div className="mt-7 rounded-2xl border bg-card p-10 text-center">
              <h3 className="text-xl font-semibold">
                Products coming soon
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no published products in this category yet.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Browse all cakes
              </Link>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {categoryProducts.map(({ product }) => (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  name={product.name}
                  price={Number(product.basePrice)}
                  href={`/cakes/${product.slug}`}
                  image={product.images[0]?.url}
                  initiallyFavorited={product.favorites.length > 0}
                  authenticated={Boolean(session?.user?.id)}
                />
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
