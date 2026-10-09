import { CouponType } from "@/generated/enums";

type CalculateCouponDiscountInput = {
  type: CouponType;
  value: number;
  subtotal?: number;
  eligibleSubtotal?: number;
  orderSubtotal?: number;
  maximumDiscount?: number | null;
};

function normalizeCurrency(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

export function calculateCouponDiscount({
  type,
  value,
  subtotal,
  eligibleSubtotal,
  orderSubtotal,
  maximumDiscount,
}: CalculateCouponDiscountInput): number {
  const primarySubtotal = normalizeCurrency(subtotal ?? 0);
  const effectiveEligibleSubtotal = normalizeCurrency(
    eligibleSubtotal ?? subtotal ?? 0
  );
  const effectiveOrderSubtotal = normalizeCurrency(
    orderSubtotal ?? subtotal ?? 0
  );
  const safeValue = normalizeCurrency(value);

  if (
    primarySubtotal <= 0 &&
    effectiveEligibleSubtotal <= 0 &&
    effectiveOrderSubtotal <= 0
  ) {
    return 0;
  }

  if (safeValue <= 0) {
    return 0;
  }

  const safeMaximumDiscount =
    maximumDiscount === null || maximumDiscount === undefined
      ? Number.POSITIVE_INFINITY
      : normalizeCurrency(maximumDiscount);

  const rawDiscount =
    type === CouponType.PERCENTAGE
      ? effectiveEligibleSubtotal * (safeValue / 100)
      : safeValue;

  const cappedDiscount = Math.min(
    rawDiscount,
    effectiveEligibleSubtotal,
    effectiveOrderSubtotal,
    safeMaximumDiscount
  );

  return Math.round((Math.max(0, cappedDiscount) + Number.EPSILON) * 100) / 100;
}