interface CustomizationSummaryProps {
  customization: unknown;
  className?: string;
}

interface DisplayChoice {
  name: string;
  price?: number;
}

interface DisplayOption {
  name: string;
  values: DisplayChoice[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptions(value: unknown): DisplayOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.name !== "string") {
      return [];
    }

    const values = Array.isArray(entry.values)
      ? entry.values.flatMap((choice) =>
          isRecord(choice) && typeof choice.name === "string"
            ? [
                {
                  name: choice.name,
                  ...(typeof choice.price === "number"
                    ? { price: choice.price }
                    : {}),
                },
              ]
            : []
        )
      : [];

    return values.length > 0 ? [{ name: entry.name, values }] : [];
  });
}

function formatPrice(value: number) {
  return `€${value.toFixed(2)}`;
}

export function CustomizationSummary({
  customization,
  className,
}: CustomizationSummaryProps) {
  if (!isRecord(customization)) {
    return null;
  }

  const options = readOptions(customization.options);
  const details = options.map((option) => ({
    label: option.name,
    value: option.values.map((choice) => choice.name).join(", "),
    price: option.values.reduce((sum, choice) => sum + (choice.price ?? 0), 0),
  }));

  if (options.length === 0) {
    for (const key of ["size", "flavour", "decoration"] as const) {
      const value = customization[key];
      if (typeof value === "string" && value) {
        details.push({
          label:
            key === "flavour"
              ? "Flavour"
              : key[0].toUpperCase() + key.slice(1),
          value,
          price: 0,
        });
      }
    }

    if (
      Array.isArray(customization.extras) &&
      customization.extras.every((value) => typeof value === "string") &&
      customization.extras.length > 0
    ) {
      details.push({
        label: "Extras",
        value: customization.extras.join(", "),
        price: 0,
      });
    }
  }

  if (typeof customization.message === "string" && customization.message.trim()) {
    details.push({
      label: "Personalisation",
      value: customization.message.trim(),
      price: 0,
    });
  }

  if (details.length === 0) {
    return null;
  }

  return (
    <dl className={className ?? "mt-3 space-y-1 text-sm text-muted-foreground"}>
      {details.map((detail, index) => (
        <div
          key={`${detail.label}-${index}`}
          className="flex flex-wrap justify-between gap-x-3"
        >
          <dt className="font-medium text-foreground">{detail.label}</dt>
          <dd className="whitespace-pre-wrap text-right">
            {detail.value}
            {options.length > 0 && detail.price > 0
              ? ` (+${formatPrice(detail.price)})`
              : ""}
          </dd>
        </div>
      ))}
    </dl>
  );
}
