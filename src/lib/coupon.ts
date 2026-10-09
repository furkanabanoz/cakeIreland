import { prisma } from "@/lib/prisma";
import { CouponType, CouponScope } from "@/generated/enums";
import { calculateCouponDiscount } from "@/lib/coupon-discount";

export type CouponValidationResult =
  | {
      valid: true;
      coupon: {
        id: string;
        code: string;
        type: CouponType;
        value: string;
        minimumOrder: string | null;
        maximumDiscount: string | null;
        freeDelivery: boolean;
        scope: CouponScope;
      };
      discount: string;
    }
  | {
      valid: false;
      message: string;
    };

type ValidateCouponInput = {
  code: string;
  subtotal: number;
  userId?: string | null;
  productIds?: string[];
  categoryIds?: string[];
};

export async function validateCoupon(
  input: ValidateCouponInput
): Promise<CouponValidationResult> {
  const code = input.code.trim().toUpperCase();

  if (!code) {
    return {
      valid: false,
      message: "Please enter a coupon code.",
    };
  }

  const coupon = await prisma.coupon.findUnique({
    where: {
      code,
    },
    include: {
      products: true,
      categories: true,
    },
  });

  if (!coupon) {
    return {
      valid: false,
      message: "This coupon code is not valid.",
    };
  }

  if (!coupon.active) {
    return {
      valid: false,
      message: "This coupon is no longer active.",
    };
  }

  const now = new Date();

  if (coupon.startsAt && now < coupon.startsAt) {
    return {
      valid: false,
      message: "This coupon is not active yet.",
    };
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return {
      valid: false,
      message: "This coupon has expired.",
    };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    return {
      valid: false,
      message: "This coupon has reached its usage limit.",
    };
  }

  if (
    coupon.minimumOrder !== null &&
    input.subtotal < Number(coupon.minimumOrder)
  ) {
    return {
      valid: false,
      message: `A minimum order of €${Number(
        coupon.minimumOrder
      ).toFixed(2)} is required.`,
    };
  }

  if (coupon.firstOrderOnly) {
    if (!input.userId) {
      return {
        valid: false,
        message: "This coupon is available for first orders only.",
      };
    }

    const previousOrder = await prisma.order.findFirst({
      where: {
        userId: input.userId,
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
        valid: false,
        message: "This coupon is available for first orders only.",
      };
    }
  }

  if (coupon.usageLimitPerUser !== null && input.userId) {
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId: input.userId,
      },
    });

    if (userUsageCount >= coupon.usageLimitPerUser) {
      return {
        valid: false,
        message:
          "You have already used this coupon the maximum number of times.",
      };
    }
  }

  if (coupon.scope === CouponScope.PRODUCTS) {
    if (!input.productIds || input.productIds.length === 0) {
      return {
        valid: false,
        message: "This coupon does not apply to the current products.",
      };
    }

    const allowedProductIds = new Set(
      coupon.products.map((item) => item.productId)
    );

    const hasEligibleProduct = input.productIds.some((productId) =>
      allowedProductIds.has(productId)
    );

    if (!hasEligibleProduct) {
      return {
        valid: false,
        message: "This coupon does not apply to the current products.",
      };
    }
  }

  if (coupon.scope === CouponScope.CATEGORIES) {
    if (!input.categoryIds || input.categoryIds.length === 0) {
      return {
        valid: false,
        message: "This coupon does not apply to the current products.",
      };
    }

    const allowedCategoryIds = new Set(
      coupon.categories.map((item) => item.categoryId)
    );

    const hasEligibleCategory = input.categoryIds.some((categoryId) =>
      allowedCategoryIds.has(categoryId)
    );

    if (!hasEligibleCategory) {
      return {
        valid: false,
        message: "This coupon does not apply to the current products.",
      };
    }
  }

  const discount = calculateCouponDiscount({
    type: coupon.type,
    value: Number(coupon.value),
    subtotal: input.subtotal,
    eligibleSubtotal: input.subtotal,
    orderSubtotal: input.subtotal,
    maximumDiscount:
      coupon.maximumDiscount !== null
        ? Number(coupon.maximumDiscount)
        : null,
  });

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      minimumOrder: coupon.minimumOrder?.toString() ?? null,
      maximumDiscount: coupon.maximumDiscount?.toString() ?? null,
      freeDelivery: coupon.freeDelivery,
      scope: coupon.scope,
    },
    discount: discount.toFixed(2),
  };
}