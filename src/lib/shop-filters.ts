export type ShopSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type ShopSort = "featured" | "price-low" | "price-high" | "rating";

export interface ParsedShopFilters {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  flavours: string[];
  sizes: string[];
  availableOnly: boolean;
  sort: ShopSort;
  priceRangeError: boolean;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function selectedValues(value: string | string[] | undefined) {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : value ? [value] : [])
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  ).slice(0, 20);
}

function parsePrice(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseShopFilters(
  params: ShopSearchParams
): ParsedShopFilters {
  const minPrice = parsePrice(firstValue(params.minPrice));
  const maxPrice = parsePrice(firstValue(params.maxPrice));
  const priceRangeError =
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice;
  const sort = firstValue(params.sort);

  return {
    query: (firstValue(params.q)?.trim() ?? "").slice(0, 100),
    ...(priceRangeError
      ? {}
      : {
          ...(minPrice === undefined ? {} : { minPrice }),
          ...(maxPrice === undefined ? {} : { maxPrice }),
        }),
    flavours: selectedValues(params.flavour),
    sizes: selectedValues(params.size),
    availableOnly: firstValue(params.available) === "1",
    sort:
      sort === "price-low" ||
      sort === "price-high" ||
      sort === "rating"
        ? sort
        : "featured",
    priceRangeError,
  };
}
