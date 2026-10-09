import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateProductForm } from "./create-product-form";

export const instant = false;

export default async function NewProductPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const categories = await prisma.category.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
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
              Create Product
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Add a new cake product to your shop.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8">
              <h2 className="text-lg font-semibold">
                No categories available
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Create a category before creating a product.
              </p>

              <Link
                href="/admin"
                className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Back to admin
              </Link>
            </div>
          ) : (
            <CreateProductForm categories={categories} />
          )}
        </div>
      </Container>
    </main>
  );
}