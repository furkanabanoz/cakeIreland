"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Role = "CUSTOMER" | "ADMIN" | "STAFF";

type ProductOptionType =
  | "SIZE"
  | "FLAVOUR"
  | "DECORATION"
  | "EXTRA";

interface ProductImageInput {
  url: string;
  alt?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

interface ProductOptionValueInput {
  name: string;
  price: number;
  available?: boolean;
}

interface ProductOptionInput {
  name: string;
  type: ProductOptionType;
  required?: boolean;
  sortOrder?: number;
  values?: ProductOptionValueInput[];
}

interface ProductInput {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  categoryId: string;
  preparationTime?: number;
  allergens?: string[];
  seoTitle?: string;
  seoDescription?: string;
  available?: boolean;
  published?: boolean;
  images?: ProductImageInput[];
  options?: ProductOptionInput[];
}

const PRODUCT_OPTION_TYPES: ProductOptionType[] = [
  "SIZE",
  "FLAVOUR",
  "DECORATION",
  "EXTRA",
];

/*
|--------------------------------------------------------------------------
| ADMIN AUTHORIZATION
|--------------------------------------------------------------------------
*/

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });
  const role = user?.role as Role | undefined;

  if (role !== "ADMIN") {
    throw new Error(
      "You do not have permission to manage products."
    );
  }

  return session;
}

async function revalidateProductViews(
  productId: string,
  productSlug: string,
  additionalCategorySlugs: string[] = []
) {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { products: { some: { id: productId } } },
        { categoryProducts: { some: { productId } } },
      ],
    },
    select: { slug: true },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/cakes/${productSlug}`);
  for (const slug of new Set([
    ...categories.map((category) => category.slug),
    ...additionalCategorySlugs,
  ])) {
    revalidatePath(`/categories/${slug}`);
  }
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getString(
  formData: FormData,
  key: string
): string {
  return String(formData.get(key) ?? "").trim();
}

function getBoolean(
  formData: FormData,
  key: string,
  defaultValue: boolean
): boolean {
  const value = formData.get(key);

  if (value === null) {
    return defaultValue;
  }

  return value === "true" || value === "on";
}

function parseAllergens(value: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
        .filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated values.
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJson<T>(
  value: FormDataEntryValue | null,
  fallback: T
): T {
  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

function isProductOptionType(
  value: unknown
): value is ProductOptionType {
  return (
    typeof value === "string" &&
    PRODUCT_OPTION_TYPES.includes(
      value as ProductOptionType
    )
  );
}

/*
|--------------------------------------------------------------------------
| FORM DATA PARSER
|--------------------------------------------------------------------------
*/

function formDataToProductInput(
  formData: FormData
): ProductInput {
  const basePrice = Number(
    getString(formData, "basePrice")
  );

  const preparationTimeRaw = getString(
    formData,
    "preparationTime"
  );

  const preparationTime =
    preparationTimeRaw === ""
      ? 2
      : Number(preparationTimeRaw);

  const images = parseJson<ProductImageInput[]>(
    formData.get("images"),
    []
  );

  const options = parseJson<ProductOptionInput[]>(
    formData.get("options"),
    []
  );

  return {
    name: getString(formData, "name"),

    slug: getString(formData, "slug"),

    description: getString(
      formData,
      "description"
    ),

    basePrice,

    categoryId: getString(
      formData,
      "categoryId"
    ),

    preparationTime,

    allergens: parseAllergens(
      getString(formData, "allergens")
    ),

    seoTitle:
      getString(formData, "seoTitle") || undefined,

    seoDescription:
      getString(
        formData,
        "seoDescription"
      ) || undefined,

    available: getBoolean(
      formData,
      "available",
      true
    ),

    published: getBoolean(
      formData,
      "published",
      false
    ),

    images,

    options,
  };
}

/*
|--------------------------------------------------------------------------
| VALIDATE PRODUCT
|--------------------------------------------------------------------------
*/

function validateProductInput(
  data: ProductInput
): void {
  if (!data.name.trim()) {
    throw new Error(
      "Product name is required."
    );
  }

  if (!data.slug.trim()) {
    throw new Error(
      "Product slug is required."
    );
  }

  if (!data.description.trim()) {
    throw new Error(
      "Product description is required."
    );
  }

  if (
    !Number.isFinite(data.basePrice) ||
    data.basePrice < 0
  ) {
    throw new Error(
      "Invalid product price."
    );
  }

  if (!data.categoryId.trim()) {
    throw new Error(
      "Product category is required."
    );
  }

  if (
    data.preparationTime !== undefined &&
    (!Number.isInteger(
      data.preparationTime
    ) ||
      data.preparationTime < 0)
  ) {
    throw new Error(
      "Invalid preparation time."
    );
  }

  if (
    data.images !== undefined &&
    !Array.isArray(data.images)
  ) {
    throw new Error(
      "Invalid product images."
    );
  }

  if (
    data.options !== undefined &&
    !Array.isArray(data.options)
  ) {
    throw new Error(
      "Invalid product options."
    );
  }

  for (const image of data.images ?? []) {
    if (
      typeof image.url !== "string" ||
      !image.url.trim()
    ) {
      throw new Error(
        "Every product image must have a URL."
      );
    }

    if (
      image.sortOrder !== undefined &&
      (!Number.isInteger(image.sortOrder) ||
        image.sortOrder < 0)
    ) {
      throw new Error(
        "Invalid image sort order."
      );
    }
  }

  for (const option of data.options ?? []) {
    if (
      typeof option.name !== "string" ||
      !option.name.trim()
    ) {
      throw new Error(
        "Every product option must have a name."
      );
    }

    if (!isProductOptionType(option.type)) {
      throw new Error(
        `Invalid product option type for "${option.name}".`
      );
    }

    if (
      option.sortOrder !== undefined &&
      (!Number.isInteger(option.sortOrder) ||
        option.sortOrder < 0)
    ) {
      throw new Error(
        `Invalid sort order for option "${option.name}".`
      );
    }

    const valueNames = new Set<string>();
    for (const value of option.values ?? []) {
      if (
        typeof value.name !== "string" ||
        !value.name.trim()
      ) {
        throw new Error(
          `Every value in option "${option.name}" must have a name.`
        );
      }

      const normalizedName = value.name.trim().toLowerCase();
      if (valueNames.has(normalizedName)) {
        throw new Error(
          `Option "${option.name}" cannot contain duplicate values.`
        );
      }
      valueNames.add(normalizedName);

      if (
        !Number.isFinite(value.price) ||
        value.price < 0
      ) {
        throw new Error(
          `Invalid price for option value "${value.name}".`
        );
      }
    }
  }
}

/*
|--------------------------------------------------------------------------
| NORMALIZE INPUT
|--------------------------------------------------------------------------
*/

function normalizeProductInput(
  data: ProductInput
): ProductInput {
  const images = (data.images ?? [])
    .map((image, index) => ({
      url: image.url.trim(),
      alt: image.alt?.trim() || undefined,
      sortOrder:
        image.sortOrder ?? index,
      isPrimary:
        image.isPrimary ?? false,
    }))
    .filter((image) => image.url);

  if (
    images.length > 0 &&
    !images.some(
      (image) => image.isPrimary
    )
  ) {
    images[0] = {
      ...images[0],
      isPrimary: true,
    };
  }

  const normalizedOptions = (
    data.options ?? []
  )
    .map((option, optionIndex) => ({
      name: option.name.trim(),
      type: option.type,
      required: option.required ?? false,
      sortOrder:
        option.sortOrder ?? optionIndex,
      values: (option.values ?? [])
        .map((value) => ({
          name: value.name.trim(),
          price: value.price,
          available:
            value.available ?? true,
        }))
        .filter((value) => value.name),
    }))
    .filter((option) => option.name);

  return {
    name: data.name.trim(),

    slug: data.slug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"),

    description:
      data.description.trim(),

    basePrice: data.basePrice,

    categoryId:
      data.categoryId.trim(),

    preparationTime:
      data.preparationTime ?? 2,

    allergens: Array.from(
      new Set(
        (data.allergens ?? [])
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ),

    seoTitle:
      data.seoTitle?.trim() || undefined,

    seoDescription:
      data.seoDescription?.trim() ||
      undefined,

    available:
      data.available ?? true,

    published:
      data.published ?? false,

    images,

    options: normalizedOptions,
  };
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/

export async function createProduct(
  input: FormData | ProductInput
) {
  try {
    await requireAdmin();

    const data =
      input instanceof FormData
        ? formDataToProductInput(input)
        : input;

    const normalized =
      normalizeProductInput(data);

    validateProductInput(normalized);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          slug: normalized.slug,
        },
      });

    if (existingProduct) {
      return {
        success: false,
        error:
          "A product with this slug already exists.",
      };
    }

    const category =
      await prisma.category.findUnique({
        where: {
          id: normalized.categoryId,
        },
      });

    if (!category) {
      return {
        success: false,
        error: "Category not found.",
      };
    }

    const product = await prisma.$transaction(async (tx) => {
      const lastCategoryProduct = await tx.categoryProduct.findFirst({
        where: { categoryId: normalized.categoryId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const createdProduct = await tx.product.create({
        data: {
          name: normalized.name,
          slug: normalized.slug,
          description:
            normalized.description,
          basePrice:
            normalized.basePrice,
          categoryId:
            normalized.categoryId,
          preparationTime:
            normalized.preparationTime ?? 2,
          allergens:
            normalized.allergens ?? [],
          seoTitle:
            normalized.seoTitle ?? null,
          seoDescription:
            normalized.seoDescription ?? null,
          available:
            normalized.available ?? true,
          published:
            normalized.published ?? false,

          images: {
            create: (
              normalized.images ?? []
            ).map((image, index) => ({
              url: image.url,
              alt: image.alt ?? null,
              sortOrder:
                image.sortOrder ?? index,
              isPrimary:
                image.isPrimary ??
                index === 0,
            })),
          },

          options: {
            create: (
              normalized.options ?? []
            ).map(
              (option, optionIndex) => ({
                name: option.name,
                type: option.type,
                required:
                  option.required ?? false,
                sortOrder:
                  option.sortOrder ??
                  optionIndex,

                values: {
                  create: (
                    option.values ?? []
                  ).map((value) => ({
                    name: value.name,
                    price: value.price,
                    available:
                      value.available ??
                      true,
                  })),
                },
              })
            ),
          },
        },

        include: {
          category: true,

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

      await tx.categoryProduct.create({
        data: {
          categoryId: normalized.categoryId,
          productId: createdProduct.id,
          sortOrder: (lastCategoryProduct?.sortOrder ?? -1) + 1,
        },
      });

      return createdProduct;
    });

    await revalidateProductViews(product.id, product.slug);

    return {
      success: true,
      product,
    };
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create product.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/

export async function updateProduct(
  productId: string,
  input: FormData | ProductInput
) {
  try {
    await requireAdmin();

    if (!productId) {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    const data =
      input instanceof FormData
        ? formDataToProductInput(input)
        : input;

    const normalized =
      normalizeProductInput(data);

    validateProductInput(normalized);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          category: {
            select: {
              slug: true,
            },
          },
        },
      });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found.",
      };
    }

    const slugOwner =
      await prisma.product.findFirst({
        where: {
          slug: normalized.slug,
          NOT: {
            id: productId,
          },
        },
      });

    if (slugOwner) {
      return {
        success: false,
        error:
          "Another product already uses this slug.",
      };
    }

    const category =
      await prisma.category.findUnique({
        where: {
          id: normalized.categoryId,
        },
      });

    if (!category) {
      return {
        success: false,
        error: "Category not found.",
      };
    }

    const updatedProduct =
      await prisma.$transaction(
        async (tx) => {
          /*
          |--------------------------------------------------------------
          | Delete old images.
          |--------------------------------------------------------------
          */

          await tx.productImage.deleteMany({
            where: {
              productId,
            },
          });

          /*
          |--------------------------------------------------------------
          | Delete old options.
          |
          | ProductOptionValue records are removed through the
          | onDelete: Cascade relation in the Prisma schema.
          |--------------------------------------------------------------
          */

          await tx.productOption.deleteMany({
            where: {
              productId,
            },
          });

          /*
          |--------------------------------------------------------------
          | Update product and recreate nested data.
          |--------------------------------------------------------------
          */

          if (existingProduct.categoryId !== normalized.categoryId) {
            await tx.categoryProduct.deleteMany({
              where: {
                categoryId: existingProduct.categoryId,
                productId,
              },
            });
          }

          const updatedProduct = await tx.product.update({
            where: {
              id: productId,
            },

            data: {
              name: normalized.name,
              slug: normalized.slug,
              description:
                normalized.description,
              basePrice:
                normalized.basePrice,
              categoryId:
                normalized.categoryId,
              preparationTime:
                normalized.preparationTime ?? 2,
              allergens:
                normalized.allergens ?? [],
              seoTitle:
                normalized.seoTitle ?? null,
              seoDescription:
                normalized.seoDescription ??
                null,
              available:
                normalized.available ?? true,
              published:
                normalized.published ?? false,

              images: {
                create: (
                  normalized.images ?? []
                ).map((image, index) => ({
                  url: image.url,
                  alt: image.alt ?? null,
                  sortOrder:
                    image.sortOrder ?? index,
                  isPrimary:
                    image.isPrimary ??
                    index === 0,
                })),
              },

              options: {
                create: (
                  normalized.options ?? []
                ).map(
                  (
                    option,
                    optionIndex
                  ) => ({
                    name: option.name,
                    type: option.type,
                    required:
                      option.required ??
                      false,
                    sortOrder:
                      option.sortOrder ??
                      optionIndex,

                    values: {
                      create: (
                        option.values ??
                        []
                      ).map(
                        (value) => ({
                          name: value.name,
                          price: value.price,
                          available:
                            value.available ??
                            true,
                        })
                      ),
                    },
                  })
                ),
              },
            },

            include: {
              category: true,

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

          const lastCategoryProduct =
            await tx.categoryProduct.findFirst({
              where: { categoryId: normalized.categoryId },
              orderBy: { sortOrder: "desc" },
              select: { sortOrder: true },
            });

          await tx.categoryProduct.upsert({
            where: {
              categoryId_productId: {
                categoryId: normalized.categoryId,
                productId,
              },
            },
            update: {},
            create: {
              categoryId: normalized.categoryId,
              productId,
              sortOrder: (lastCategoryProduct?.sortOrder ?? -1) + 1,
            },
          });

          return updatedProduct;
        }
      );

    await revalidateProductViews(
      updatedProduct.id,
      updatedProduct.slug,
      [existingProduct.category.slug]
    );

    return {
      success: true,
      product: updatedProduct,
    };
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update product.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/

export async function deleteProduct(
  productId: string
) {
  try {
    await requireAdmin();

    if (!productId) {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          orderItems: {
            take: 1,
          },
          cartItems: {
            take: 1,
          },
          category: {
            select: {
              slug: true,
            },
          },
          categoryProducts: {
            select: {
              category: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      });

    if (!product) {
      return {
        success: false,
        error: "Product not found.",
      };
    }

    if (
      product.orderItems.length > 0 ||
      product.cartItems.length > 0
    ) {
      return {
        success: false,
        error:
          "This product cannot be deleted because it is already used in orders or carts.",
      };
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    await revalidateProductViews(
      product.id,
      product.slug,
      [
        product.category.slug,
        ...product.categoryProducts.map(
          (entry) => entry.category.slug
        ),
      ]
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete product.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| PUBLISH PRODUCT
|--------------------------------------------------------------------------
*/

export async function publishProduct(
  productId: string
) {
  try {
    await requireAdmin();

    if (!productId) {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      return {
        success: false,
        error: "Product not found.",
      };
    }

    const updatedProduct =
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          published: true,
        },
      });

    await revalidateProductViews(
      updatedProduct.id,
      updatedProduct.slug
    );

    return {
      success: true,
      product: updatedProduct,
    };
  } catch (error) {
    console.error(
      "PUBLISH PRODUCT ERROR:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to publish product.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| UNPUBLISH PRODUCT
|--------------------------------------------------------------------------
*/

export async function unpublishProduct(
  productId: string
) {
  try {
    await requireAdmin();

    if (!productId) {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

    if (!product) {
      return {
        success: false,
        error: "Product not found.",
      };
    }

    const updatedProduct =
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          published: false,
        },
      });

    await revalidateProductViews(
      updatedProduct.id,
      updatedProduct.slug
    );

    return {
      success: true,
      product: updatedProduct,
    };
  } catch (error) {
    console.error(
      "UNPUBLISH PRODUCT ERROR:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unpublish product.",
    };
  }
}