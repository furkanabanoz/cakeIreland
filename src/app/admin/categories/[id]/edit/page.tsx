import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import { Container } from "@/components/container";
import { prisma } from "@/lib/prisma";

export const instant = false;

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function EditCategoryPage({
  params,
  searchParams,
}: EditCategoryPageProps) {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      categoryProducts: {
        orderBy: [{ sortOrder: "asc" }, { productId: "asc" }],
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/admin/categories"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to categories
            </Link>
            <Link
              href={`/categories/${category.slug}?preview=1`}
              className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              View category
            </Link>
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Edit category
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Update category content, products and publishing details.
          </p>

          {query.saved === "1" && (
            <p className="mt-5 rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-medium text-green-800">
              Category saved.
            </p>
          )}

          <div className="mt-8">
            <CategoryForm
              category={{
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                heroTitle: category.heroTitle,
                heroSubtitle: category.heroSubtitle,
                heroImage: category.heroImage,
                ctaText: category.ctaText,
                ctaLink: category.ctaLink,
                seoTitle: category.seoTitle,
                seoDescription: category.seoDescription,
                published: category.published,
                featured: category.featured,
                sortOrder: category.sortOrder,
              }}
              initialProducts={category.categoryProducts.map((entry) => ({
                id: entry.product.id,
                name: entry.product.name,
                slug: entry.product.slug,
                published: entry.product.published,
                image: entry.product.images[0]?.url ?? null,
                featured: entry.featured,
              }))}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
