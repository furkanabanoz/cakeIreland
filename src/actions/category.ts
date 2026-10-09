"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Enter a category slug.")
  .max(80, "Category slugs must be 80 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens in the slug."
  );

const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(100),
  slug: slugSchema,
  description: z.string().trim().max(10000).nullable(),
  heroTitle: z.string().trim().max(160).nullable(),
  heroSubtitle: z.string().trim().max(300).nullable(),
  heroImage: z
    .string()
    .trim()
    .max(2048)
    .nullable()
    .refine(
      (value) =>
        value === null ||
        isSafeInternalPath(value) ||
        isWebUrl(value),
      "Enter an HTTP(S) image URL or a site-relative image path."
    ),
  ctaText: z.string().trim().max(80).nullable(),
  ctaLink: z
    .string()
    .trim()
    .max(2048)
    .nullable()
    .refine(
      (value) =>
        value === null ||
        isSafeInternalPath(value) ||
        isHttpsUrl(value),
      "Use a site-relative path or an HTTPS link for the CTA."
    ),
  seoTitle: z.string().trim().max(160).nullable(),
  seoDescription: z.string().trim().max(300).nullable(),
  published: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
  productIds: z.array(z.string().min(1).max(128)).max(1000),
  featuredProductIds: z.array(z.string().min(1).max(128)).max(1000),
});

function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isSafeInternalPath(value: string) {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return false;
  }

  try {
    return new URL(value, "https://cakeireland.invalid").origin ===
      "https://cakeireland.invalid";
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("You do not have permission to manage categories.");
  }
}

function optionalField(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function parseCategoryForm(formData: FormData) {
  const productIds = formData
    .getAll("productIds")
    .map(String);
  const featuredProductIds = formData
    .getAll("featuredProductIds")
    .map(String);

  const duplicateProductIds =
    new Set(productIds).size !== productIds.length;
  const featuredProductsSelected = featuredProductIds.every((id) =>
    productIds.includes(id)
  );

  if (duplicateProductIds || !featuredProductsSelected) {
    return {
      success: false as const,
      error: "The selected category products are invalid.",
    };
  }

  const sortOrderValue = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = sortOrderValue ? Number(sortOrderValue) : Number.NaN;
  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: optionalField(formData, "description"),
    heroTitle: optionalField(formData, "heroTitle"),
    heroSubtitle: optionalField(formData, "heroSubtitle"),
    heroImage: optionalField(formData, "heroImage"),
    ctaText: optionalField(formData, "ctaText"),
    ctaLink: optionalField(formData, "ctaLink"),
    seoTitle: optionalField(formData, "seoTitle"),
    seoDescription: optionalField(formData, "seoDescription"),
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
    sortOrder,
    productIds,
    featuredProductIds,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Check the category details.",
    };
  }

  if (Boolean(parsed.data.ctaText) !== Boolean(parsed.data.ctaLink)) {
    return {
      success: false as const,
      error: "Enter both CTA text and a CTA link, or leave both blank.",
    };
  }

  return { success: true as const, data: parsed.data };
}

async function validateProducts(productIds: string[]) {
  if (productIds.length === 0) {
    return true;
  }

  const count = await prisma.product.count({
    where: {
      id: { in: productIds },
    },
  });

  return count === productIds.length;
}

async function replaceCategoryProducts(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  categoryId: string,
  productIds: string[],
  featuredProductIds: string[]
) {
  await tx.categoryProduct.deleteMany({
    where: { categoryId },
  });

  if (productIds.length > 0) {
    await tx.categoryProduct.createMany({
      data: productIds.map((productId, sortOrder) => ({
        categoryId,
        productId,
        sortOrder,
        featured: featuredProductIds.includes(productId),
      })),
    });
  }
}

function revalidateCategoryPaths(slugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");

  for (const slug of new Set(slugs)) {
    if (slug) {
      revalidatePath(`/categories/${slug}`);
    }
  }
}

function databaseErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return "That category slug is already in use.";
  }

  console.error("CATEGORY MANAGEMENT ERROR:", error);
  return fallback;
}

export async function searchCategoryProducts(query: string) {
  await requireAdmin();

  const parsedQuery = z.string().trim().max(100).safeParse(query);
  if (!parsedQuery.success) {
    return [];
  }

  const search = parsedQuery.data;
  const products = await prisma.product.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 20,
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
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    published: product.published,
    image: product.images[0]?.url ?? null,
  }));
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return parsed;
  }

  if (!(await validateProducts(parsed.data.productIds))) {
    return {
      success: false as const,
      error: "One or more selected products no longer exist.",
    };
  }

  const existing = await prisma.category.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existing) {
    return {
      success: false as const,
      error: "That category slug is already in use.",
    };
  }

  try {
    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          heroTitle: parsed.data.heroTitle,
          heroSubtitle: parsed.data.heroSubtitle,
          heroImage: parsed.data.heroImage,
          ctaText: parsed.data.ctaText,
          ctaLink: parsed.data.ctaLink,
          seoTitle: parsed.data.seoTitle,
          seoDescription: parsed.data.seoDescription,
          published: parsed.data.published,
          featured: parsed.data.featured,
          sortOrder: parsed.data.sortOrder,
        },
      });

      await replaceCategoryProducts(
        tx,
        created.id,
        parsed.data.productIds,
        parsed.data.featuredProductIds
      );
      return created;
    });

    revalidateCategoryPaths([category.slug]);
    return { success: true as const, id: category.id };
  } catch (error) {
    return {
      success: false as const,
      error: databaseErrorMessage(error, "Unable to create the category."),
    };
  }
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const validId = z.string().min(1).max(128).safeParse(categoryId);
  if (!validId.success) {
    return { success: false as const, error: "Invalid category." };
  }

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return parsed;
  }

  if (!(await validateProducts(parsed.data.productIds))) {
    return {
      success: false as const,
      error: "One or more selected products no longer exist.",
    };
  }

  const unselectedPrimaryProductCount = await prisma.product.count({
    where: {
      categoryId,
      id: { notIn: parsed.data.productIds },
    },
  });
  if (unselectedPrimaryProductCount > 0) {
    return {
      success: false as const,
      error:
        "Move products to a different primary category in product settings before removing them here.",
    };
  }

  const [existing, slugOwner] = await Promise.all([
    prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, slug: true },
    }),
    prisma.category.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    }),
  ]);

  if (!existing) {
    return { success: false as const, error: "Category not found." };
  }

  if (slugOwner && slugOwner.id !== categoryId) {
    return {
      success: false as const,
      error: "That category slug is already in use.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: categoryId },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          heroTitle: parsed.data.heroTitle,
          heroSubtitle: parsed.data.heroSubtitle,
          heroImage: parsed.data.heroImage,
          ctaText: parsed.data.ctaText,
          ctaLink: parsed.data.ctaLink,
          seoTitle: parsed.data.seoTitle,
          seoDescription: parsed.data.seoDescription,
          published: parsed.data.published,
          featured: parsed.data.featured,
          sortOrder: parsed.data.sortOrder,
        },
      });

      await replaceCategoryProducts(
        tx,
        categoryId,
        parsed.data.productIds,
        parsed.data.featuredProductIds
      );
    });

    revalidateCategoryPaths([existing.slug, parsed.data.slug]);
    revalidatePath(`/admin/categories/${categoryId}/edit`);
    return { success: true as const, id: categoryId };
  } catch (error) {
    return {
      success: false as const,
      error: databaseErrorMessage(error, "Unable to update the category."),
    };
  }
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();

  const parsedId = z
    .string()
    .min(1)
    .max(128)
    .safeParse(String(formData.get("categoryId") ?? "").trim());
  if (!parsedId.success) {
    return { success: false as const, error: "Invalid category." };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      slug: true,
      _count: {
        select: {
          products: true,
          categoryProducts: true,
          couponCategories: true,
        },
      },
    },
  });

  if (!category) {
    return { success: false as const, error: "Category not found." };
  }

  if (category._count.products > 0 || category._count.categoryProducts > 0) {
    return {
      success: false as const,
      error: "Remove or reassign this category's products before deleting it.",
    };
  }

  if (category._count.couponCategories > 0) {
    return {
      success: false as const,
      error: "Remove this category from coupon rules before deleting it.",
    };
  }

  try {
    await prisma.category.delete({ where: { id: category.id } });
  } catch (error) {
    return {
      success: false as const,
      error: databaseErrorMessage(error, "Unable to delete the category."),
    };
  }

  revalidateCategoryPaths([category.slug]);
  return { success: true as const };
}
