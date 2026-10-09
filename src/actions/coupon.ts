"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCouponDiscount } from "@/lib/coupon-discount";

interface ApplyCouponInput {
  code: string;
  subtotal: number;
  items: {
    productId: string;
    categoryId: string;
    subtotal: number;
  }[];
}

interface CouponResult {
  success: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    discount: number;
    freeDelivery: boolean;
  };
}

export async function applyCoupon(
  input: ApplyCouponInput
): Promise<CouponResult> {
  const session = await auth();

  const code = input.code.trim().toUpperCase();

  if (!code) {
    return {
      success: false,
      error: "Please enter a coupon code.",
    };
  }

  if (
    !Number.isFinite(input.subtotal) ||
    input.subtotal < 0
  ) {
    return {
      success: false,
      error: "Invalid order subtotal.",
    };
  }

  const coupon = await prisma.coupon.findUnique({
    where: {
      code,
    },
    include: {
      products: {
        select: {
          productId: true,
        },
      },
      categories: {
        select: {
          categoryId: true,
        },
      },
    },
  });

  if (!coupon) {
    return {
      success: false,
      error: "Invalid coupon code.",
    };
  }

  if (!coupon.active) {
    return {
      success: false,
      error: "This coupon is no longer active.",
    };
  }

  const now = new Date();

  if (coupon.startsAt && now < coupon.startsAt) {
    return {
      success: false,
      error: "This coupon is not active yet.",
    };
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return {
      success: false,
      error: "This coupon has expired.",
    };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    return {
      success: false,
      error: "This coupon has reached its usage limit.",
    };
  }

  if (
    coupon.minimumOrder !== null &&
    input.subtotal < Number(coupon.minimumOrder)
  ) {
    return {
      success: false,
      error: `Minimum order value for this coupon is €${Number(
        coupon.minimumOrder
      ).toFixed(2)}.`,
    };
  }

  if (
    coupon.firstOrderOnly ||
    coupon.usageLimitPerUser !== null
  ) {
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Please sign in to use this coupon.",
      };
    }
  }

  if (coupon.firstOrderOnly) {
    const previousOrder = await prisma.order.findFirst({
      where: {
        userId: session!.user.id,
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        id: true,
      },
    });

    if (previousOrder) {
      return {
        success: false,
        error:
          "This coupon is only available for your first order.",
      };
    }
  }

  if (
    coupon.usageLimitPerUser !== null &&
    session?.user?.id
  ) {
    const userUsageCount =
      await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: session.user.id,
        },
      });

    if (
      userUsageCount >= coupon.usageLimitPerUser
    ) {
      return {
        success: false,
        error:
          "You have already used this coupon the maximum number of times.",
      };
    }
  }

  if (coupon.scope === "PRODUCTS") {
    const allowedProducts = new Set(
      coupon.products.map(
        (item) => item.productId
      )
    );

    const validProduct = input.items.some((item) =>
      allowedProducts.has(item.productId)
    );

    if (!validProduct) {
      return {
        success: false,
        error:
          "This coupon does not apply to the products in your cart.",
      };
    }
  }

  if (coupon.scope === "CATEGORIES") {
    const allowedCategories = new Set(
      coupon.categories.map(
        (item) => item.categoryId
      )
    );

    const validCategory = input.items.some((item) =>
      allowedCategories.has(item.categoryId)
    );

    if (!validCategory) {
      return {
        success: false,
        error:
          "This coupon does not apply to the products in your cart.",
      };
    }
  }

  const eligibleSubtotal =
    coupon.scope === "PRODUCTS"
      ? input.items.reduce(
          (eligible, item) =>
            coupon.products.some(
              (product) => product.productId === item.productId
            )
              ? eligible + item.subtotal
              : eligible,
          0
        )
      : coupon.scope === "CATEGORIES"
        ? input.items.reduce(
            (eligible, item) =>
              coupon.categories.some(
                (category) => category.categoryId === item.categoryId
              )
                ? eligible + item.subtotal
                : eligible,
            0
          )
        : input.subtotal;

  const discount = calculateCouponDiscount({
    type: coupon.type,
    value: Number(coupon.value),
    eligibleSubtotal,
    orderSubtotal: input.subtotal,
    maximumDiscount:
      coupon.maximumDiscount === null
        ? null
        : Number(coupon.maximumDiscount),
  });

  return {
    success: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
      freeDelivery: coupon.freeDelivery,
    },
  };
}