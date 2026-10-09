import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCouponDiscount,
  calculateOrderTotal,
  hasSlotCapacity,
  roundMoney,
} from "./checkout-calculations";

test("rounds currency to two decimal places", () => {
  assert.equal(roundMoney(12.345), 12.35);
  assert.equal(roundMoney(12.344), 12.34);
});

test("calculates percentage discounts with maximum and eligible subtotal caps", () => {
  assert.equal(
    calculateCouponDiscount({
      type: "PERCENTAGE",
      value: 25,
      eligibleSubtotal: 40,
      orderSubtotal: 100,
    }),
    10
  );

  assert.equal(
    calculateCouponDiscount({
      type: "PERCENTAGE",
      value: 80,
      eligibleSubtotal: 10,
      orderSubtotal: 30,
      maximumDiscount: 5,
    }),
    5
  );
});

test("caps fixed discounts and order totals without going negative", () => {
  assert.equal(
    calculateCouponDiscount({
      type: "FIXED_AMOUNT",
      value: 100,
      eligibleSubtotal: 20,
      orderSubtotal: 20,
    }),
    20
  );

  assert.equal(
    calculateOrderTotal({
      subtotal: 20,
      discount: 20,
      deliveryFee: 5,
    }),
    5
  );
  assert.equal(
    calculateOrderTotal({
      subtotal: 20,
      discount: 25,
      deliveryFee: 0,
    }),
    0
  );
});

test("adds delivery fees only when the selected fulfilment includes one", () => {
  assert.equal(
    calculateOrderTotal({
      subtotal: 40,
      discount: 0,
      deliveryFee: 5,
    }),
    45
  );
  assert.equal(
    calculateOrderTotal({
      subtotal: 40,
      discount: 0,
      deliveryFee: 0,
    }),
    40
  );
});

test("treats non-finite values as zero and leaves totals non-negative", () => {
  assert.equal(roundMoney(Number.NaN), 0);
  assert.equal(
    calculateCouponDiscount({
      type: "PERCENTAGE",
      value: Number.NaN,
      eligibleSubtotal: 100,
      orderSubtotal: 100,
    }),
    0
  );
  assert.equal(
    calculateOrderTotal({
      subtotal: Number.NaN,
      discount: 25,
      deliveryFee: 10,
    }),
    0
  );
  assert.equal(hasSlotCapacity(Number.NaN, 3), true);
});

test("allows a slot only while booked orders are below capacity", () => {
  assert.equal(hasSlotCapacity(2, 3), true);
  assert.equal(hasSlotCapacity(3, 3), false);
});
