import Link from "next/link";

import { Container } from "@/components/container";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      published: true,
      featured: true,
      sortOrder: true,
      _count: {
        select: {
          products: true,
          categoryProducts: true,
        },
      },
    },
  });

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Admin
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Categories
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Manage category pages, visibility, product selection and search
                details.
              </p>
            </div>
            <Link
              href="/admin/categories/new"
              className="inline-flex w-fit rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              + Create category
            </Link>
          </div>

          <div className="mt-8 rounded-xl border bg-card px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total categories
            </p>
            <p className="mt-1 text-2xl font-bold">{categories.length}</p>
          </div>

          {categories.length === 0 ? (
            <section className="mt-6 rounded-2xl border bg-card p-10 text-center">
              <h2 className="text-xl font-semibold">No categories yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a category to start organizing products and build its
                landing page.
              </p>
              <Link
                href="/admin/categories/new"
                className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Create category
              </Link>
            </section>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b bg-secondary/40">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold">
                        Category
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Products
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Featured
                      </th>
                      <th className="px-5 py-4 text-left font-semibold">
                        Order
                      </th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="transition-colors hover:bg-secondary/20"
                      >
                        <td className="px-5 py-5">
                          <p className="font-semibold">{category.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            /categories/{category.slug}
                          </p>
                        </td>
                        <td className="px-5 py-5">
                          {Math.max(
                            category._count.products,
                            category._count.categoryProducts
                          )}
                        </td>
                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              category.published
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {category.published ? "Published" : "Unpublished"}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          {category.featured ? "Yes" : "No"}
                        </td>
                        <td className="px-5 py-5">{category.sortOrder}</td>
                        <td className="px-5 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/categories/${category.slug}?preview=1`}
                              className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/categories/${category.id}/edit`}
                              className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
                            >
                              Edit
                            </Link>
                            <DeleteCategoryButton
                              categoryId={category.id}
                              categoryName={category.name}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y md:hidden">
                {categories.map((category) => (
                  <article key={category.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold">{category.name}</h2>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          /categories/{category.slug}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          category.published
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {category.published ? "Published" : "Unpublished"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span>
                        {Math.max(
                          category._count.products,
                          category._count.categoryProducts
                        )}{" "}
                        products
                      </span>
                      <span>Order {category.sortOrder}</span>
                      <span>{category.featured ? "Featured" : "Not featured"}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/categories/${category.slug}?preview=1`}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold"
                      >
                        Edit
                      </Link>
                      <DeleteCategoryButton
                        categoryId={category.id}
                        categoryName={category.name}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
