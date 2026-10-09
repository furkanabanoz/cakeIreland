"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProductCustomizationPrice } from "@/lib/product-customization";

interface CustomizationInput {
  selections?: Record<string, string | string[]>;
  size?: string;
  flavour?: string;
  decoration?: string;
  extras?: string[];
  message?: string;
}

/*
|--------------------------------------------------------------------------
| ADD TO CART
|--------------------------------------------------------------------------
*/

export async function addToCart(
  productId: string,
  quantity: number,
  customization: CustomizationInput
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Please sign in before adding products to your cart.",
    };
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return {
      success: false,
      error: "Invalid quantity.",
    };
  }

  if (
    typeof productId !== "string" ||
    !productId.trim() ||
    !customization ||
    typeof customization !== "object" ||
    Array.isArray(customization)
  ) {
    return {
      success: false,
      error: "Invalid cake customization.",
    };
  }

  const selectedValues = [
    customization.size,
    customization.flavour,
    customization.decoration,
  ];
  if (
    selectedValues.some(
      (value) => value !== undefined && typeof value !== "string"
    )
  ) {
    return {
      success: false,
      error: "Invalid cake customization.",
    };
  }

  if (
    customization.extras !== undefined &&
    (!Array.isArray(customization.extras) ||
      !customization.extras.every((extra) => typeof extra === "string"))
  ) {
    return {
      success: false,
      error: "Invalid cake extras.",
    };
  }

  if (
    customization.selections !== undefined &&
    (!customization.selections ||
      typeof customization.selections !== "object" ||
      Array.isArray(customization.selections) ||
      Object.values(customization.selections).some(
        (value) =>
          typeof value !== "string" &&
          (!Array.isArray(value) ||
            !value.every((entry) => typeof entry === "string"))
      ))
  ) {
    return {
      success: false,
      error: "Invalid cake option selections.",
    };
  }

  if (
    customization.message !== undefined &&
    (typeof customization.message !== "string" ||
      customization.message.length > 1000)
  ) {
    return {
      success: false,
      error: "Cake personalization must be 1000 characters or fewer.",
    };
  }

  const userId = session.user.id;

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      options: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          values: {
            where: {
              available: true,
            },
          },
        },
      },
    },
  });

  if (!product || !product.published || !product.available) {
    return {
      success: false,
      error: "This product is currently unavailable.",
    };
  }

  const typeCounts = product.options.reduce(
    (counts, option) =>
      counts.set(option.type, (counts.get(option.type) ?? 0) + 1),
    new Map<string, number>()
  );
  const selections = customization.selections
    ? Object.fromEntries(
        Object.entries(customization.selections).map(([optionId, value]) => [
          optionId,
          Array.isArray(value)
            ? value.map((entry) => entry.trim()).filter(Boolean)
            : value.trim(),
        ])
      )
    : Object.fromEntries(
        product.options.map((option) => {
          if ((typeCounts.get(option.type) ?? 0) > 1) {
            return [option.id, option.type === "EXTRA" ? [] : ""];
          }

          switch (option.type) {
            case "SIZE":
              return [option.id, customization.size?.trim() ?? ""];
            case "FLAVOUR":
              return [option.id, customization.flavour?.trim() ?? ""];
            case "DECORATION":
              return [option.id, customization.decoration?.trim() ?? ""];
            case "EXTRA":
              return [option.id, customization.extras ?? []];
          }
        })
      );

  const selectedOptionDetails = product.options
    .map((option) => {
      const rawSelection = selections[option.id];
      const selectedNames = Array.isArray(rawSelection)
        ? Array.from(new Set(rawSelection))
        : typeof rawSelection === "string" && rawSelection
          ? [rawSelection]
          : [];

      return {
        optionId: option.id,
        name: option.name,
        type: option.type,
        values: option.values
          .filter((value) => selectedNames.includes(value.name))
          .map((value) => ({
            name: value.name,
            price: Number(value.price),
          })),
      };
    })
    .filter((option) => option.values.length > 0);

  const legacyValue = (type: "SIZE" | "FLAVOUR" | "DECORATION") =>
    selectedOptionDetails.find((option) => option.type === type)?.values[0]
      ?.name ?? null;
  const legacyExtras = selectedOptionDetails
    .filter((option) => option.type === "EXTRA")
    .flatMap((option) => option.values.map((value) => value.name));

  const pricing = calculateProductCustomizationPrice(
    Number(product.basePrice),
    product.options.map((option) => ({
      id: option.id,
      name: option.name,
      type: option.type,
      required: option.required,
      values: option.values.map((value) => ({
        name: value.name,
        price: Number(value.price),
      })),
    })),
    {
      ...selections,
    }
  );

  if (!pricing.success) {
    return pricing;
  }

  const unitPrice = pricing.unitPrice;

  /*
  |--------------------------------------------------------------------------
  | FIND OR CREATE ACTIVE CART
  |--------------------------------------------------------------------------
  */

  let cart = await prisma.cart.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
        status: "ACTIVE",
      },
    });
  }

  console.log("ADD TO CART USER:", userId);
  console.log("ADD TO CART CART:", cart.id);

  /*
  |--------------------------------------------------------------------------
  | CREATE CART ITEM
  |--------------------------------------------------------------------------
  */

  const cartItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity,
      unitPrice,
      customization: {
        options: selectedOptionDetails,
        size: legacyValue("SIZE"),
        flavour: legacyValue("FLAVOUR"),
        decoration: legacyValue("DECORATION"),
        extras: legacyExtras,
        message: customization.message?.trim() || null,
      },
    },
  });

  console.log("ADD TO CART ITEM:", cartItem.id);

  return {
    success: true,
    cartItemId: cartItem.id,
    unitPrice,
  };
}

/*
|--------------------------------------------------------------------------
| GET ACTIVE CART
|--------------------------------------------------------------------------
*/

export async function getCart() {
  const session = await auth();

  if (!session?.user?.id) {
    console.log("GET CART: NO SESSION");
    return null;
  }

  const userId = session.user.id;

  console.log("GET CART USER:", userId);

  const cart = await prisma.cart.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      items: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          product: {
  select: {
    id: true,
    name: true,
    slug: true,
    basePrice: true,
    categoryId: true,
    available: true,
    published: true,
    images: {
      where: {
        isPrimary: true,
      },
      take: 1,
    },
  },
},
        },
      },
    },
  });

  console.log(
    "GET CART RESULT:",
    cart
      ? {
          id: cart.id,
          userId: cart.userId,
          status: cart.status,
          itemCount: cart.items.length,
        }
      : null
  );

  return cart;
}

export async function getCartDrawerData() {
  const cart = await getCart();

  return {
    items:
      cart?.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.images[0]?.url ?? null,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })) ?? [],
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE CART ITEM
|--------------------------------------------------------------------------
*/

export async function updateCartItem(
  cartItemId: string,
  quantity: number
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Please sign in.",
    };
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return {
      success: false,
      error: "Invalid quantity.",
    };
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    },
  });

  if (!cartItem) {
    return {
      success: false,
      error: "Cart item not found.",
    };
  }

  await prisma.cartItem.update({
    where: {
      id: cartItem.id,
    },
    data: {
      quantity,
    },
  });

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| REMOVE CART ITEM
|--------------------------------------------------------------------------
*/

export async function removeCartItem(
  cartItemId: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Please sign in.",
    };
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    },
  });

  if (!cartItem) {
    return {
      success: false,
      error: "Cart item not found.",
    };
  }

  await prisma.cartItem.delete({
    where: {
      id: cartItem.id,
    },
  });

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| CLEAR CART
|--------------------------------------------------------------------------
*/

export async function clearCart() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Please sign in.",
    };
  }

  const cart = await prisma.cart.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
  });

  if (!cart) {
    return {
      success: true,
    };
  }

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });

  return {
    success: true,
  };
}
