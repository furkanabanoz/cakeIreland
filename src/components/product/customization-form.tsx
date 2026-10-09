"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { addToCart } from "@/actions/cart";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  CAKE_PERSONALIZATION_LIMIT,
  emptyPersonalization,
  serializePersonalization,
  type CakePersonalization,
} from "@/lib/cake-personalization";

type OptionType = "SIZE" | "FLAVOUR" | "DECORATION" | "EXTRA";

interface CustomizationOption {
  id: string;
  name: string;
  type: OptionType;
  required: boolean;
  sortOrder: number;
  values: {
    name: string;
    price: number;
  }[];
}

interface CustomizationFormProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    available: boolean;
    options: CustomizationOption[];
  };
}

function formatPrice(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

const optionDescriptions: Record<OptionType, string> = {
  SIZE: "Choose one option.",
  FLAVOUR: "Choose one option.",
  DECORATION: "Choose one option.",
  EXTRA: "Choose any options you would like.",
};

function CakeDiagram({ tiers }: { tiers: number }) {
  const tierCount = Math.min(Math.max(tiers, 1), 4);
  const baseY = 136;
  const tierHeight = 24;
  const widths = [148, 120, 94, 68];

  return (
    <svg
      role="img"
      aria-label={`${tierCount}-tier schematic cake preview`}
      viewBox="0 0 220 160"
      className="mx-auto h-40 w-full max-w-56"
    >
      <ellipse cx="110" cy="142" rx="88" ry="10" fill="#eadfd8" />
      {Array.from({ length: tierCount }, (_, index) => {
        const width = widths[index];
        const x = 110 - width / 2;
        const y = baseY - (index + 1) * tierHeight;

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={width}
              height={tierHeight}
              rx="7"
              fill="#f7e9dc"
              stroke="#bc947b"
              strokeWidth="2"
            />
            <path
              d={`M ${x} ${y + 10} Q ${x + width / 2} ${y + 16} ${x + width} ${y + 10}`}
              fill="none"
              stroke="#fffaf5"
              strokeWidth="5"
            />
          </g>
        );
      })}
      <path
        d="M104 30 Q110 20 116 30 L116 38 L104 38 Z"
        fill="#d98b91"
      />
      <path
        d="M110 18 C105 24 104 27 110 30 C116 27 115 24 110 18"
        fill="#e8b35d"
      />
    </svg>
  );
}

export function CustomizationForm({
  product,
}: CustomizationFormProps) {
  const { refreshAndOpen } = useCartDrawer();
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | string[]>
  >({});
  const [personalization, setPersonalization] =
    useState<CakePersonalization>(emptyPersonalization);
  const message = serializePersonalization(personalization);
  const personalizationIsValid =
    message.length <= CAKE_PERSONALIZATION_LIMIT;
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const optionsAreValid =
    new Set(product.options.map((option) => option.id)).size ===
    product.options.length;
  const options = useMemo(
    () => [...product.options].sort((left, right) => left.sortOrder - right.sortOrder),
    [product.options]
  );
  const requiredOptions = options.filter((option) => option.required);
  const selectedRequiredOptions = requiredOptions.filter((option) => {
    const selected = selectedOptions[option.id];
    return Array.isArray(selected) ? selected.length > 0 : Boolean(selected);
  }).length;
  const requiredOptionsAvailable = requiredOptions.every(
    (option) => option.values.length > 0
  );
  const canAddToCart =
    optionsAreValid &&
    product.available &&
    personalizationIsValid &&
    requiredOptionsAvailable &&
    selectedRequiredOptions === requiredOptions.length;

  const selectedPriceCents = options.reduce((total, option) => {
    const selection = selectedOptions[option.id];
    const selectedNames = Array.isArray(selection)
      ? selection
      : typeof selection === "string"
        ? [selection]
        : [];

    return (
      total +
      option.values.reduce(
        (sum, value) =>
          selectedNames.includes(value.name)
            ? sum + Math.round(value.price * 100)
            : sum,
        0
      )
    );
  }, 0);
  const totalPriceCents =
    Math.round(product.price * 100) + selectedPriceCents;
  const selectedTierCount = useMemo(() => {
    const tierOption = options.find((option) => /tier/i.test(option.name));
    const selection = tierOption
      ? selectedOptions[tierOption.id]
      : undefined;
    const tierValue =
      typeof selection === "string"
        ? Number(selection.match(/\d+/)?.[0])
        : Number.NaN;

    return Number.isInteger(tierValue) && tierValue > 0
      ? Math.min(tierValue, 4)
      : 1;
  }, [options, selectedOptions]);

  function selectOption(optionId: string, name: string) {
    setSelectedOptions((current) => ({
      ...current,
      [optionId]: name,
    }));
    setStatus("");
  }

  function toggleExtra(optionId: string, name: string) {
    setSelectedOptions((current) => {
      const selected = current[optionId];
      const names = Array.isArray(selected) ? selected : [];

      return {
        ...current,
        [optionId]: names.includes(name)
          ? names.filter((item) => item !== name)
          : [...names, name],
      };
    });
    setStatus("");
  }

  async function handleAddToCart() {
    if (!canAddToCart || loading) {
      setStatus("Choose an available option for each required step.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const result = await addToCart(product.id, 1, {
        selections: selectedOptions,
        message,
      });

      if (!result.success) {
        setStatus(result.error ?? "Unable to add this cake to your cart.");
        return;
      }

      trackAnalyticsEvent("add_to_cart", {
        currency: "EUR",
        value: result.unitPrice,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: result.unitPrice,
            quantity: 1,
          },
        ],
      });

      try {
        await refreshAndOpen();
        setStatus("Your cake and chosen design have been saved in your cart.");
      } catch (cause) {
        console.error(
          "Product was added, but the cart drawer could not refresh.",
          cause
        );
        setStatus(
          "Your cake was saved in your cart. Open the cart page to review your order."
        );
      }
    } catch (cause) {
      console.error("Unable to add the customized cake to the cart.", cause);
      setStatus("We couldn't add your cake. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="cake-builder-title"
      className="mt-8 rounded-2xl border bg-card p-5 shadow-sm sm:p-7"
    >
      <div className="border-b pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Made your way
        </p>
        <h2 id="cake-builder-title" className="mt-2 text-2xl font-bold tracking-tight">
          Build your cake
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose each design step and see the itemized price update as you go.
          {requiredOptions.length > 0 &&
            ` ${selectedRequiredOptions} of ${requiredOptions.length} required choices selected.`}
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          Dietary choices are preferences only and do not guarantee an
          allergen-free cake or prevent cross-contact. Contact the bakery
          before ordering if you have an allergy or dietary safety concern.
        </p>
      </div>

      {!optionsAreValid && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-950"
        >
          This cake&apos;s options need to be reviewed before it can be
          ordered. Please contact us for help.
        </p>
      )}

      <div className="divide-y">
        {options.map((option, optionIndex) => {
          const selection = selectedOptions[option.id];
          const selectedNames = Array.isArray(selection)
            ? selection
            : typeof selection === "string"
              ? [selection]
              : [];

          return (
            <fieldset
              key={option.id}
              className="py-5 first:pt-5 last:pb-5"
              aria-describedby={`${option.id}-help`}
              aria-required={option.required}
            >
              <legend className="font-semibold">
                <span className="mr-2 text-sm font-medium text-primary">
                  {String(optionIndex + 1).padStart(2, "0")}
                </span>
                {option.name}
                <span className="ml-2 text-xs font-medium text-muted-foreground">
                  {option.required ? "Required" : "Optional"}
                </span>
              </legend>
              <p
                id={`${option.id}-help`}
                className="mt-1 text-sm text-muted-foreground"
              >
                {optionDescriptions[option.type]}
              </p>

              {option.values.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  {option.required
                    ? "This required choice is temporarily unavailable. Please contact us before ordering."
                    : "There are no choices available right now."}
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {option.values.map((value, valueIndex) => {
                    const selected = selectedNames.includes(value.name);
                    const inputId = `${option.id}-${valueIndex}`;

                    return (
                      <label
                        key={value.name}
                        htmlFor={inputId}
                        className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "hover:border-primary/40 hover:bg-accent/50"
                        } focus-within:ring-2 focus-within:ring-ring`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <input
                            id={inputId}
                            type={option.type === "EXTRA" ? "checkbox" : "radio"}
                            name={`cake-${product.id}-${option.id}`}
                            checked={selected}
                            onChange={() =>
                              option.type === "EXTRA"
                                ? toggleExtra(option.id, value.name)
                                : selectOption(option.id, value.name)
                            }
                            className="size-4 shrink-0 accent-primary"
                          />
                          <span className="text-sm font-medium">{value.name}</span>
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {value.price === 0
                            ? "Included"
                            : `+${formatPrice(Math.round(value.price * 100))}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="border-t pt-5">
        <h3 className="font-semibold">Personalise your cake</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          These details are instructions for the bakery, not a guaranteed
          preview. The bakery may contact you to confirm the design.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["message", "Cake message", "Happy birthday!"],
              ["topperText", "Topper text", "Best day ever"],
              ["secondLine", "Second text line", "Optional extra line"],
              ["name", "Name", "Name to include"],
              ["age", "Age", "Age to include"],
              ["date", "Date", "Date to include"],
              ["emoji", "Emoji", "🎂"],
            ] as const
          ).map(([field, label, placeholder]) => (
            <label key={field} className="text-sm font-medium">
              {label}
              <input
                type="text"
                value={personalization[field]}
                onChange={(event) =>
                  setPersonalization((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
                maxLength={field === "message" ? 250 : 100}
                placeholder={placeholder}
                className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
          <label className="text-sm font-medium">
            Font preference
            <input
              type="text"
              value={personalization.font}
              onChange={(event) =>
                setPersonalization((current) => ({
                  ...current,
                  font: event.target.value,
                }))
              }
              maxLength={100}
              placeholder="Any lettering style"
              className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-sm font-medium">
            Text colour preference
            <input
              type="color"
              value={personalization.textColor || "#704b3e"}
              onChange={(event) =>
                setPersonalization((current) => ({
                  ...current,
                  textColor: event.target.value,
                }))
              }
              className="mt-1 block h-10 w-full rounded-lg border bg-background p-1"
            />
          </label>
          <label className="text-sm font-medium">
            Text position preference
            <input
              type="text"
              value={personalization.textPosition}
              onChange={(event) =>
                setPersonalization((current) => ({
                  ...current,
                  textPosition: event.target.value,
                }))
              }
              maxLength={100}
              placeholder="Where should the text go?"
              className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Special note for the bakery
            <textarea
              value={personalization.specialNote}
              onChange={(event) =>
                setPersonalization((current) => ({
                  ...current,
                  specialNote: event.target.value,
                }))
              }
              rows={3}
              maxLength={250}
              placeholder="Any other details to help us understand your request"
              className="mt-1 w-full resize-y rounded-xl border bg-background p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
        <p
          className={`mt-2 text-right text-xs ${
            personalizationIsValid
              ? "text-muted-foreground"
              : "text-destructive"
          }`}
          aria-live="polite"
        >
          {message.length}/{CAKE_PERSONALIZATION_LIMIT} characters
          {!personalizationIsValid &&
            " — shorten your personalization to continue."}
        </p>
      </div>

      <div className="mt-5 grid gap-4 rounded-xl bg-secondary/50 p-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:p-5">
        <div className="rounded-lg bg-background/70 p-3 text-center">
          <h3 className="text-sm font-semibold">2D design preview</h3>
          <CakeDiagram tiers={selectedTierCount} />
          <p className="text-xs leading-5 text-muted-foreground">
            A simple tier sketch, not a photorealistic rendering. Confirm the
            written choices below for your exact design.
          </p>
        </div>

        <aside aria-label="Your cake design and price">
          <h3 className="font-semibold">Your design & price</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Base price</dt>
              <dd>{formatPrice(Math.round(product.price * 100))}</dd>
            </div>
            {options.map((option) => {
              const selection = selectedOptions[option.id];
              const selectedNames = Array.isArray(selection)
                ? selection
                : typeof selection === "string"
                  ? [selection]
                  : [];
              const selectedValues = option.values.filter((value) =>
                selectedNames.includes(value.name)
              );

              return (
                <div key={option.id} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{option.name}</dt>
                  <dd className="text-right">
                    {selectedValues.length === 0
                      ? "Not selected"
                      : `${selectedValues.map((value) => value.name).join(", ")}${
                          selectedValues.some((value) => value.price > 0)
                            ? ` · ${formatPrice(
                                selectedValues.reduce(
                                  (sum, value) =>
                                    sum + Math.round(value.price * 100),
                                  0
                                )
                              )}`
                            : " · Included"
                        }`}
                  </dd>
                </div>
              );
            })}
            {message && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Personalisation</dt>
                <dd className="max-w-[65%] whitespace-pre-wrap text-right">
                  {message}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <dt className="font-semibold">Estimated total</dt>
              <dd className="text-2xl font-bold">
                {formatPrice(totalPriceCents)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAddToCart || loading}
        className="mt-4 w-full rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!product.available
          ? "Currently unavailable"
          : !optionsAreValid
            ? "Options need review"
            : loading
              ? "Adding to cart..."
              : !requiredOptionsAvailable
                ? "Required options unavailable"
                : !personalizationIsValid
                  ? "Shorten personalization"
                  : !canAddToCart
                  ? "Choose required options"
                  : `Add design to cart · ${formatPrice(totalPriceCents)}`}
      </button>
      <p
        role={status ? "status" : undefined}
        aria-live="polite"
        className="mt-3 min-h-5 text-center text-sm text-muted-foreground"
      >
        {status === "Please sign in before adding products to your cart." ? (
          <>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/cakes/${product.slug}`)}`}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Sign in
            </Link>{" "}
            to save your cake design in the cart.
          </>
        ) : (
          status
        )}
      </p>
      <p className="text-center text-xs text-muted-foreground">
        Adding this design saves its choices with your cart item. Final price is
        recalculated from the latest admin-configured prices.
      </p>
    </section>
  );
}
