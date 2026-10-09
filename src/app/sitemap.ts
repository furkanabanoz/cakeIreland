import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        slug: "asc",
      },
    }),
    prisma.category.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  return [
    {
      url: absoluteUrl("/"),
    },
    {
      url: absoluteUrl("/shop"),
    },
    ...[
      "/delivery",
      "/allergens",
      "/contact",
      "/privacy",
      "/cookies",
      "/terms",
      "/refund",
    ].map((path) => ({
      url: absoluteUrl(path),
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/cakes/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
    })),
  ];
}
