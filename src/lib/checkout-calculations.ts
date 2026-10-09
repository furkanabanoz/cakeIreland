function coerceFiniteNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function roundMoney(value: number): number {
  const safeValue = coerceFiniteNumber(value);

  return Math.round((safeValue + Number.EPSILON) * 100) / 100;
}

export function calculateCouponDiscount({
  type,
  value,
  eligibleSubtotal,
  orderSubtotal,
  maximumDiscount,
}: {
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  eligibleSubtotal: number;
  orderSubtotal: number;
  maximumDiscount?: number | null;
}) {
  const safeEligibleSubtotal = Math.max(
    0,
    coerceFiniteNumber(eligibleSubtotal)
  );
  const safeOrderSubtotal = Math.max(
    0,
    coerceFiniteNumber(orderSubtotal)
  );
  const safeValue = Math.max(0, coerceFiniteNumber(value));
  const safeMaximumDiscount =
    maximumDiscount === null || maximumDiscount === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(0, coerceFiniteNumber(maximumDiscount));

  const rawDiscount =
    type === "PERCENTAGE"
      ? safeEligibleSubtotal * (safeValue / 100)
      : safeValue;

  return roundMoney(
    Math.max(
      0,
      Math.min(
        rawDiscount,
        safeEligibleSubtotal,
        safeOrderSubtotal,
        safeMaximumDiscount
      )
    )
  );
}

export function calculateOrderTotal({
  subtotal,
  discount,
  deliveryFee,
}: {
  subtotal: number;
  discount: number;
  deliveryFee: number;
}) {
  const safeSubtotal = Math.max(0, coerceFiniteNumber(subtotal));
  const safeDiscount = Math.max(0, coerceFiniteNumber(discount));
  const safeDeliveryFee = Math.max(0, coerceFiniteNumber(deliveryFee));

  return roundMoney(
    Math.max(0, safeSubtotal - safeDiscount + safeDeliveryFee)
  );
}

export function hasSlotCapacity(
  bookedOrders: number,
  capacity: number
) {
  const safeBookedOrders = coerceFiniteNumber(bookedOrders, 0);
  const safeCapacity = Math.max(0, coerceFiniteNumber(capacity, 0));

  return safeBookedOrders < safeCapacity;
}
