import assert from "node:assert/strict";
import test from "node:test";

import { parseAdminOptionValues } from "./admin-option-values";

test("parses priced choices and prevents duplicates", () => {
  const result = parseAdminOptionValues(
    "Vanilla | 0\nChocolate | 2.50",
    ["Vanilla"]
  );

  assert.deepEqual(result.values, [
    { name: "Chocolate", price: 2.5 },
  ]);
  assert.deepEqual(result.invalidLines, [1]);
});

test("rejects missing, malformed, negative, and duplicate values", () => {
  const result = parseAdminOptionValues(
    "Missing price\nChocolate | two\nVegan | -1\nVegan | 0\nVanilla | 0",
    ["Vanilla"]
  );

  assert.deepEqual(result.values, [
    { name: "Vegan", price: 0 },
  ]);
  assert.deepEqual(result.invalidLines, [1, 2, 3, 5]);
});

test("limits a bulk import to 100 non-empty lines", () => {
  const input = Array.from(
    { length: 101 },
    (_, index) => `Choice ${index} | 0`
  ).join("\n");

  assert.deepEqual(
    parseAdminOptionValues(input, []),
    { values: [], invalidLines: [0] }
  );
});
