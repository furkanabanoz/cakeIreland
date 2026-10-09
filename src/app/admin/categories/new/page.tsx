import Link from "next/link";

import { Container } from "@/components/container";
import { CategoryForm } from "@/components/admin/category-form";

export const instant = false;

export default function NewCategoryPage() {
  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <Link
            href="/admin/categories"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to categories
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Create category
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up a category, choose its products and shape its public landing
            page.
          </p>

          <div className="mt-8">
            <CategoryForm initialProducts={[]} />
          </div>
        </div>
      </Container>
    </main>
  );
}
