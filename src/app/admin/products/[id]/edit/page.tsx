import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { EditProductForm } from "./edit-product-form";

export const instant = false;

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      options: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          values: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ published: true }, { id: product.categoryId }],
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const initialProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.basePrice),
    categoryId: product.categoryId,
    preparationTime: product.preparationTime,
    allergens: product.allergens,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    available: product.available,
    published: product.published,

    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),

    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      type: option.type,
      required: option.required,
      sortOrder: option.sortOrder,

      values: option.values.map((value) => ({
        id: value.id,
        name: value.name,
        price: Number(value.price),
        available: value.available,
      })),
    })),
  };

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <Link
              href="/admin/products"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to products
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">
              Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Edit Product
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Update product information, options, images and publishing
              settings.
            </p>
          </div>

          <EditProductForm
            product={initialProduct}
            categories={categories}
          />
        </div>
      </Container>
    </main>
  );
}