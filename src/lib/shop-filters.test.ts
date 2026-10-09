import assert from "node:assert/strict";
import test from "node:test";

import { parseShopFilters } from "./shop-filters";

test("parses shop search, price, availability and sort filters", () => {
  assert.deepEqual(
    parseShopFilters({
      q: "  birthday cake ",
      minPrice: "15.50",
      maxPrice: "80",
      available: "1",
      sort: "price-high",
    }),
    {
      query: "birthday cake",
      minPrice: 15.5,
      maxPrice: 80,
      flavours: [],
      sizes: [],
      availableOnly: true,
      sort: "price-high",
      priceRangeError: false,
    }
  );
});

test("collects distinct repeated facet values and caps their number", () => {
  const flavours = Array.from({ length: 25 }, (_, index) => `Flavour ${index}`);
  assert.deepEqual(
    parseShopFilters({
      flavour: [...flavours, flavours[0]],
      size: ['8"', '10"'],
    }).flavours,
    flavours.slice(0, 20)
  );
  assert.deepEqual(parseShopFilters({ size: ['8"', '10"'] }).sizes, [
    '8"',
    '10"',
  ]);
});

test("ignores invalid prices and refuses a reversed price range", () => {
  assert.deepEqual(
    parseShopFilters({ minPrice: "NaN", maxPrice: "-1" }),
    {
      query: "",
      flavours: [],
      sizes: [],
      availableOnly: false,
      sort: "featured",
      priceRangeError: false,
    }
  );
  assert.deepEqual(
    parseShopFilters({ minPrice: "50", maxPrice: "10" }),
    {
      query: "",
      flavours: [],
      sizes: [],
      availableOnly: false,
      sort: "featured",
      priceRangeError: true,
    }
  );
});

test("defaults unknown sort values to featured and trims search length", () => {
  assert.equal(
    parseShopFilters({ q: "x".repeat(120), sort: "random" }).query.length,
    100
  );
  assert.equal(
    parseShopFilters({ sort: "random" }).sort,
    "featured"
  );
});
