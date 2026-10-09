import Link from "next/link";

import { Container } from "@/components/container";
import { prisma } from "@/lib/prisma";

const categoryEmojis: Record<string, string> = {
  birthday: "🎂",
  wedding: "💍",
  cupcakes: "🧁",
  chocolate: "🍫",
  cheesecakes: "🍰",
  celebration: "🎉",
  custom: "✨",
  seasonal: "🌸",
};

export async function Categories() {
  const categories = await prisma.category.findMany({
    where: {
      published: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      featured: true,
    },
  });

  return (
    <section className="py-16">
      <Container>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Explore
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Shop by category
          </h2>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No categories are currently available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group rounded-2xl border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <div className="text-4xl">
                  {categoryEmojis[category.slug] ?? "🍰"}
                </div>

                <p className="mt-4 text-sm font-semibold group-hover:text-primary">
                  {category.name}
                </p>
                {category.featured && (
                  <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Featured
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}