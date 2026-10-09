import assert from "node:assert/strict";
import test from "node:test";

import { calculateProductCustomizationPrice } from "./product-customization";

const options = [
  {
    id: "size",
    name: "Size",
    type: "SIZE" as const,
    required: true,
    values: [
      { name: '8"', price: 8 },
      { name: '10"', price: 15 },
    ],
  },
  {
    id: "flavour",
    name: "Flavour",
    type: "FLAVOUR" as const,
    required: true,
    values: [
      { name: "Vanilla", price: 0 },
      { name: "Red Velvet", price: 5 },
    ],
  },
  {
    id: "decoration",
    name: "Decoration",
    type: "DECORATION" as const,
    required: false,
    values: [
      { name: "Standard", price: 0 },
      { name: "Luxury", price: 20 },
    ],
  },
  {
    id: "extras",
    name: "Extras",
    type: "EXTRA" as const,
    required: false,
    values: [
      { name: "Candles", price: 3 },
      { name: "Flowers", price: 8 },
    ],
  },
];

test("calculates the base price and selected option prices in cents", () => {
  const result = calculateProductCustomizationPrice(60, options, {
    size: '10"',
    flavour: "Red Velvet",
    decoration: "Luxury",
    extras: ["Candles", "Flowers"],
  });

  assert.deepEqual(result, { success: true, unitPrice: 111 });
});

test("requires every required option group to have a selection", () => {
  const result = calculateProductCustomizationPrice(60, options, {
    size: '8"',
    flavour: "",
  });

  assert.deepEqual(result, {
    success: false,
    error: "Please choose an option for flavour.",
  });
});

test("rejects values that are not among currently available product options", () => {
  const result = calculateProductCustomizationPrice(60, options, {
    size: '12"',
    flavour: "Vanilla",
  });

  assert.deepEqual(result, {
    success: false,
    error: "Selected size is not available.",
  });
});

test("rejects an extra that is not among the configured values", () => {
  const result = calculateProductCustomizationPrice(60, options, {
    size: '8"',
    flavour: "Vanilla",
    extras: ["Gold topper"],
  });

  assert.deepEqual(result, {
    success: false,
    error: "Selected extras is not available.",
  });
});

test("allows optional choices to be skipped", () => {
  const result = calculateProductCustomizationPrice(60, options, {
    size: '8"',
    flavour: "Vanilla",
  });

  assert.deepEqual(result, { success: true, unitPrice: 68 });
});

test("requires at least one selection from a required extras group", () => {
  const requiredExtras = options.map((option) =>
    option.type === "EXTRA" ? { ...option, required: true } : option
  );
  const result = calculateProductCustomizationPrice(60, requiredExtras, {
    size: '8"',
    flavour: "Vanilla",
  });

  assert.deepEqual(result, {
    success: false,
    error: "Please choose an option for extras.",
  });
});

test("allows distinct groups of the same type to represent separate design steps", () => {
  const result = calculateProductCustomizationPrice(
    60,
    [
      options[0],
      {
        ...options[0],
        id: "tiers",
        name: "Number of tiers",
        values: [
          { name: "1 tier", price: 0 },
          { name: "2 tiers", price: 10 },
        ],
      },
      options[1],
    ],
    {
      size: '8"',
      tiers: "2 tiers",
      flavour: "Vanilla",
    }
  );

  assert.deepEqual(result, { success: true, unitPrice: 78 });
});

test("rejects selections for unknown option groups", () => {
  const result = calculateProductCustomizationPrice(60, options, {
    size: '8"',
    flavour: "Vanilla",
    unknown: "value",
  });

  assert.deepEqual(result, {
    success: false,
    error: "One of the selected cake options is no longer available.",
  });
});

test("rejects checkbox selections for single-choice option groups", () => {
  const result = calculateProductCustomizationPrice(60, options, {
    size: ['8"'],
    flavour: "Vanilla",
  });

  assert.deepEqual(result, {
    success: false,
    error: "Invalid selection for size.",
  });
});

test("rejects duplicate option ids", () => {
  const result = calculateProductCustomizationPrice(
    60,
    [options[0], { ...options[1], id: options[0].id }],
    { size: '8"', flavour: "Vanilla" }
  );

  assert.equal(result.success, false);
});

test("requires a choice when a required group has no available values", () => {
  const result = calculateProductCustomizationPrice(
    60,
    [{ ...options[0], values: [] }],
    { size: "" }
  );

  assert.deepEqual(result, {
    success: false,
    error: "No choices are currently available for size. Please contact us.",
  });
});
