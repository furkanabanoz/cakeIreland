export interface ParsedAdminOptionValue {
  name: string;
  price: number;
}

export interface AdminOptionValueParseResult {
  values: ParsedAdminOptionValue[];
  invalidLines: number[];
}

export function parseAdminOptionValues(
  input: string,
  existingNames: string[]
): AdminOptionValueParseResult {
  const seen = new Set(existingNames.map((name) => name.trim().toLowerCase()));
  const values: ParsedAdminOptionValue[] = [];
  const invalidLines: number[] = [];
  const lines = input.split(/\r?\n/);

  if (lines.filter((line) => line.trim()).length > 100) {
    return { values: [], invalidLines: [0] };
  }

  lines.forEach((line, index) => {
    if (!line.trim()) {
      return;
    }

    const separator = line.lastIndexOf("|");
    if (separator < 1) {
      invalidLines.push(index + 1);
      return;
    }

    const name = line.slice(0, separator).trim();
    const rawPrice = line.slice(separator + 1).trim();
    const price = Number(rawPrice);
    const normalizedName = name.toLowerCase();

    if (
      !name ||
      name.length > 120 ||
      !/^(?:\d+)(?:\.\d{1,2})?$/.test(rawPrice) ||
      !Number.isFinite(price) ||
      price < 0 ||
      seen.has(normalizedName)
    ) {
      invalidLines.push(index + 1);
      return;
    }

    seen.add(normalizedName);
    values.push({ name, price });
  });

  return { values, invalidLines };
}
