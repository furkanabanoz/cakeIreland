export type ProductOptionType =
  | "SIZE"
  | "FLAVOUR"
  | "DECORATION"
  | "EXTRA";

export interface ProductOptionValue {
  name: string;
  price: number;
}

export interface ProductCustomizationOption {
  id: string;
  name: string;
  type: ProductOptionType;
  required: boolean;
  values: ProductOptionValue[];
}

export interface ProductCustomizationSelections {
  [optionId: string]: string | string[] | undefined;
}

type CustomizationResult =
  | { success: true; unitPrice: number }
  | { success: false; error: string };

export function calculateProductCustomizationPrice(
  basePrice: number,
  options: ProductCustomizationOption[],
  selections: ProductCustomizationSelections
): CustomizationResult {
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return { success: false, error: "This cake has an invalid price." };
  }

  if (new Set(options.map((option) => option.id)).size !== options.length) {
    return {
      success: false,
      error:
        "This cake's option groups are not configured correctly. Please contact us before ordering.",
    };
  }

  const optionIds = new Set(options.map((option) => option.id));
  if (Object.keys(selections).some((id) => !optionIds.has(id))) {
    return {
      success: false,
      error: "One of the selected cake options is no longer available.",
    };
  }

  let totalCents = Math.round(basePrice * 100);

  for (const option of options) {
    const rawSelection = selections[option.id];
    if (
      rawSelection !== undefined &&
      (option.type === "EXTRA"
        ? !Array.isArray(rawSelection) ||
          !rawSelection.every((value) => typeof value === "string")
        : typeof rawSelection !== "string")
    ) {
      return {
        success: false,
        error: `Invalid selection for ${option.name.toLowerCase()}.`,
      };
    }

    const selected =
      option.type === "EXTRA"
        ? Array.isArray(rawSelection)
          ? Array.from(new Set(rawSelection.map((value) => value.trim()).filter(Boolean)))
          : []
        : typeof rawSelection === "string"
          ? [rawSelection.trim()]
          : [];

    if (option.required && option.values.length === 0) {
      return {
        success: false,
        error: `No choices are currently available for ${option.name.toLowerCase()}. Please contact us.`,
      };
    }

    if (option.required && !selected.some(Boolean)) {
      return {
        success: false,
        error: `Please choose an option for ${option.name.toLowerCase()}.`,
      };
    }

    for (const selectedName of selected) {
      if (!selectedName) {
        continue;
      }

      const value = option.values.find(
        (candidate) => candidate.name === selectedName
      );

      if (!value) {
        return {
          success: false,
          error: `Selected ${option.name.toLowerCase()} is not available.`,
        };
      }

      if (!Number.isFinite(value.price) || value.price < 0) {
        return {
          success: false,
          error: `Selected ${option.name.toLowerCase()} has an invalid price.`,
        };
      }

      totalCents += Math.round(value.price * 100);
    }
  }

  return {
    success: true,
    unitPrice: totalCents / 100,
  };
}
