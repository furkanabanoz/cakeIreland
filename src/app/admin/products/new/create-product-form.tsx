"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createProduct } from "@/actions/product";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { parseAdminOptionValues } from "@/lib/admin-option-values";

interface Category {
  id: string;
  name: string;
}

interface CreateProductFormProps {
  categories: Category[];
}

type OptionType =
  | "SIZE"
  | "FLAVOUR"
  | "DECORATION"
  | "EXTRA";

interface OptionValue {
  name: string;
  price: string;
  available: boolean;
}

interface ProductOption {
  name: string;
  type: OptionType;
  required: boolean;
  values: OptionValue[];
  bulkValues: string;
}

interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export function CreateProductForm({
  categories,
}: CreateProductFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [allergens, setAllergens] = useState("");

  /*
  |--------------------------------------------------------------------------
  | IMAGES
  |--------------------------------------------------------------------------
  */

  const [images, setImages] = useState<ProductImage[]>([
    {
      url: "",
      alt: "",
      isPrimary: true,
    },
  ]);

  /*
  |--------------------------------------------------------------------------
  | OPTIONS
  |--------------------------------------------------------------------------
  */

  const [options, setOptions] = useState<ProductOption[]>([]);

  /*
  |--------------------------------------------------------------------------
  | IMAGE HELPERS
  |--------------------------------------------------------------------------
  */

  function addImage() {
    setImages((current) => [
      ...current,
      {
        url: "",
        alt: "",
        isPrimary: false,
      },
    ]);
  }

  function removeImage(index: number) {
    setImages((current) => {
      const next = current.filter(
        (_, imageIndex) =>
          imageIndex !== index
      );

      if (
        next.length > 0 &&
        !next.some(
          (image) => image.isPrimary
        )
      ) {
        next[0].isPrimary = true;
      }

      return next;
    });
  }

  function updateImage(
    index: number,
    field: keyof ProductImage,
    value: string | boolean
  ) {
    setImages((current) =>
      current.map((image, imageIndex) => {
        if (imageIndex !== index) {
          return image;
        }

        if (
          field === "isPrimary" &&
          value === true
        ) {
          return {
            ...image,
            isPrimary: true,
          };
        }

        return {
          ...image,
          [field]: value,
        };
      })
    );
  }

  function setPrimaryImage(index: number) {
    setImages((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        isPrimary:
          imageIndex === index,
      }))
    );
  }

  /*
  |--------------------------------------------------------------------------
  | OPTION HELPERS
  |--------------------------------------------------------------------------
  */

  function addOption(
    type: OptionType
  ) {
    setOptions((current) => [
      ...current,
      {
        name:
          type === "SIZE"
            ? "Size"
            : type === "FLAVOUR"
            ? "Flavour"
            : type === "DECORATION"
            ? "Decoration"
            : "Extras",

        type,

        required:
          type !== "EXTRA",

        bulkValues: "",

        values: [
          {
            name: "",
            price: "0",
            available: true,
          },
        ],
      },
    ]);
  }

  function importOptionValues(optionIndex: number) {
    const option = options[optionIndex];
    const result = parseAdminOptionValues(
      option.bulkValues,
      option.values.map((value) => value.name)
    );

    if (result.invalidLines.length > 0) {
      setError(
        result.invalidLines[0] === 0
          ? "Paste no more than 100 choices at a time."
          : `Check line${result.invalidLines.length === 1 ? "" : "s"} ${result.invalidLines.join(", ")}. Use “Choice name | extra price”, with a price such as 0 or 2.50; names must be unique.`
      );
      return;
    }

    setError(null);
    setOptions((current) =>
      current.map((currentOption, index) =>
        index === optionIndex
          ? {
              ...currentOption,
              bulkValues: "",
              values: [
                ...currentOption.values,
                ...result.values.map((value) => ({
                  name: value.name,
                  price: String(value.price),
                  available: true,
                })),
              ],
            }
          : currentOption
      )
    );
  }

  function removeOption(
    optionIndex: number
  ) {
    setOptions((current) =>
      current.filter(
        (_, index) =>
          index !== optionIndex
      )
    );
  }

  function moveOption(optionIndex: number, direction: -1 | 1) {
    setOptions((current) => {
      const nextIndex = optionIndex + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[optionIndex], next[nextIndex]] = [
        next[nextIndex],
        next[optionIndex],
      ];
      return next;
    });
  }

  function updateOption(
    optionIndex: number,
    field:
      | "name"
      | "type"
      | "required"
      | "bulkValues",
    value: string | boolean
  ) {
    setOptions((current) =>
      current.map((option, index) => {
        if (index !== optionIndex) {
          return option;
        }

        return {
          ...option,
          [field]: value,
        };
      })
    );
  }

  function addOptionValue(
    optionIndex: number
  ) {
    setOptions((current) =>
      current.map((option, index) => {
        if (index !== optionIndex) {
          return option;
        }

        return {
          ...option,
          values: [
            ...option.values,
            {
              name: "",
              price: "0",
              available: true,
            },
          ],
        };
      })
    );
  }

  function removeOptionValue(
    optionIndex: number,
    valueIndex: number
  ) {
    setOptions((current) =>
      current.map((option, index) => {
        if (index !== optionIndex) {
          return option;
        }

        return {
          ...option,
          values: option.values.filter(
            (_, index) =>
              index !== valueIndex
          ),
        };
      })
    );
  }

  function updateOptionValue(
    optionIndex: number,
    valueIndex: number,
    field:
      | "name"
      | "price"
      | "available",
    value: string | boolean
  ) {
    setOptions((current) =>
      current.map((option, index) => {
        if (index !== optionIndex) {
          return option;
        }

        return {
          ...option,
          values: option.values.map(
            (optionValue, currentValueIndex) => {
              if (
                currentValueIndex !==
                valueIndex
              ) {
                return optionValue;
              }

              return {
                ...optionValue,
                [field]: value,
              };
            }
          ),
        };
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (uploadsInProgress > 0) {
      setError("Wait for image uploads to finish before saving.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData =
        new FormData(event.currentTarget);

      /*
      |--------------------------------------------------------------------------
      | ALLERGENS
      |--------------------------------------------------------------------------
      */

      formData.set(
        "allergens",
        JSON.stringify(
          allergens
            .split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean)
        )
      );

      /*
      |--------------------------------------------------------------------------
      | IMAGES
      |--------------------------------------------------------------------------
      */

      const validImages = images
        .filter(
          (image) =>
            image.url.trim()
        )
        .map(
          (image, index) => ({
            url:
              image.url.trim(),

            alt:
              image.alt.trim() ||
              undefined,

            sortOrder:
              index,

            isPrimary:
              image.isPrimary,
          })
        );

      formData.set(
        "images",
        JSON.stringify(
          validImages
        )
      );

      /*
      |--------------------------------------------------------------------------
      | OPTIONS
      |--------------------------------------------------------------------------
      */

      const validOptions = options
        .map((option) => ({
          name:
            option.name.trim(),

          type:
            option.type,

          required:
            option.required,

          sortOrder:
            options.indexOf(option),

          values:
            option.values
              .filter(
                (value) =>
                  value.name.trim()
              )
              .map(
                (value) => ({
                  name:
                    value.name.trim(),

                  price:
                    Number(
                      value.price || 0
                    ),

                  available:
                    value.available,
                })
              ),
        }))
        .filter(
          (option) =>
            option.name &&
            option.values.length > 0
        );

      formData.set(
        "options",
        JSON.stringify(
          validOptions
        )
      );

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */

      const result =
        await createProduct(
          formData
        );

      if (!result.success) {
        setError(
          result.error ??
            "Failed to create product."
        );

        setLoading(false);

        return;
      }

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "CREATE PRODUCT FORM ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );

      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ---------------------------------------------------------------- */}
      {/* BASIC INFORMATION */}
      {/* ---------------------------------------------------------------- */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          Basic information
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Product name, slug and description.
        </p>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold"
            >
              Name
            </label>

            <input
              id="name"
              name="name"
              required
              placeholder="Chocolate Birthday Cake"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="text-sm font-semibold"
            >
              Slug
            </label>

            <input
              id="slug"
              name="slug"
              required
              placeholder="chocolate-birthday-cake"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Used in the product URL.
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="text-sm font-semibold"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="Describe the cake..."
              className="mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* PRICING */}
      {/* ---------------------------------------------------------------- */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          Pricing & category
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="basePrice"
              className="text-sm font-semibold"
            >
              Price (€)
            </label>

            <input
              id="basePrice"
              name="basePrice"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="35.00"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="text-sm font-semibold"
            >
              Category
            </label>

            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue=""
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option
                value=""
                disabled
              >
                Select category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="preparationTime"
              className="text-sm font-semibold"
            >
              Preparation Time
              (minutes)
            </label>

            <input
              id="preparationTime"
              name="preparationTime"
              type="number"
              min="1"
              step="1"
              defaultValue="2"
              required
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* IMAGES */}
      {/* ---------------------------------------------------------------- */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Images
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Add product image URLs.
            </p>
          </div>

          <button
            type="button"
            onClick={addImage}
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            + Add image
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {images.map(
            (image, index) => (
              <div
                key={index}
                className="rounded-xl border p-4"
              >
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label className="text-sm font-semibold">
                      Image URL
                    </label>

                    <input
                      value={image.url}
                      onChange={(event) =>
                        updateImage(
                          index,
                          "url",
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <ImageUploadField
                      value={image.url}
                      onChange={(url) => updateImage(index, "url", url)}
                      onUploadingChange={(uploading) =>
                        setUploadsInProgress((count) =>
                          Math.max(0, count + (uploading ? 1 : -1))
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold">
                      Alt text
                    </label>

                    <input
                      value={image.alt}
                      onChange={(event) =>
                        updateImage(
                          index,
                          "alt",
                          event.target.value
                        )
                      }
                      placeholder="Chocolate birthday cake"
                      className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          index
                        )
                      }
                      disabled={
                        images.length === 1
                      }
                      className="rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="primaryImage"
                    checked={
                      image.isPrimary
                    }
                    onChange={() =>
                      setPrimaryImage(
                        index
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="font-medium">
                    Primary image
                  </span>
                </label>
              </div>
            )
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* OPTIONS */}
      {/* ---------------------------------------------------------------- */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <div>
          <h2 className="text-xl font-semibold">
            Options & extras
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Create as many ordered design steps as needed (for example,
            tiers, sponge, filling, frosting, colours or finishing touches).
            Name each step clearly, set its available choices and prices,
            and mark it required when customers must answer it. Extra-type
            steps allow multiple selections in one group, but fillings cannot
            currently be assigned to individual tiers. HEX values can be
            included in choice names but are not structured colour swatches.
            Dietary labels are customer preferences, not allergen-safety
            guarantees.
          </p>
        </div>

        {/* Add option buttons */}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              addOption("SIZE")
            }
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            + Size
          </button>

          <button
            type="button"
            onClick={() =>
              addOption("FLAVOUR")
            }
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            + Flavour
          </button>

          <button
            type="button"
            onClick={() =>
              addOption("DECORATION")
            }
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            + Decoration
          </button>

          <button
            type="button"
            onClick={() =>
              addOption("EXTRA")
            }
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            + Extra
          </button>
        </div>

        {/* Options list */}

        <div className="mt-6 space-y-5">
          {options.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-medium">
                No options added.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Add a size, flavour, decoration
                or extra above.
              </p>
            </div>
          ) : (
            options.map(
              (option, optionIndex) => (
                <div
                  key={optionIndex}
                  className="rounded-2xl border p-5"
                >
                  {/* Option header */}

                  <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto]">
                    <div>
                      <label className="text-sm font-semibold">
                        Option name
                      </label>

                      <input
                        value={
                          option.name
                        }
                        onChange={(event) =>
                          updateOption(
                            optionIndex,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Size"
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold">
                        Type
                      </label>

                      <select
                        value={
                          option.type
                        }
                        onChange={(event) =>
                          updateOption(
                            optionIndex,
                            "type",
                            event.target.value as OptionType
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="SIZE">
                          Size
                        </option>

                        <option value="FLAVOUR">
                          Flavour
                        </option>

                        <option value="DECORATION">
                          Decoration
                        </option>

                        <option value="EXTRA">
                          Extra
                        </option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-label={`Move ${option.name || "option"} up`}
                          disabled={optionIndex === 0}
                          onClick={() => moveOption(optionIndex, -1)}
                          className="rounded-lg border px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${option.name || "option"} down`}
                          disabled={optionIndex === options.length - 1}
                          onClick={() => moveOption(optionIndex, 1)}
                          className="rounded-lg border px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOption(optionIndex)}
                          className="rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Required */}

                  <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        option.required
                      }
                      onChange={(event) =>
                        updateOption(
                          optionIndex,
                          "required",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />

                    <span className="font-medium">
                      Customer must select
                      an option
                    </span>
                  </label>

                  {/* Values */}

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Values
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Add choices and set each extra price. Values remain unavailable until saved and published.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addOptionValue(
                            optionIndex
                          )
                        }
                        className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary"
                      >
                        + Add value
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <label className="text-xs font-semibold" htmlFor={`bulk-option-${optionIndex}`}>
                          Add many choices
                        </label>
                        <textarea
                          id={`bulk-option-${optionIndex}`}
                          value={option.bulkValues}
                          onChange={(event) =>
                            updateOption(optionIndex, "bulkValues", event.target.value)
                          }
                          rows={3}
                          placeholder={"Vanilla | 0\nChocolate | 2.50"}
                          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          One choice per line: name | extra price in €. Each imported choice is enabled; review its price and availability below before saving.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => importOptionValues(optionIndex)}
                        className="self-end rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-secondary"
                      >
                        Import choices
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {option.values.map(
                        (
                          value,
                          valueIndex
                        ) => (
                          <div
                            key={
                              valueIndex
                            }
                            className="grid gap-3 rounded-xl bg-secondary/30 p-4 sm:grid-cols-[1fr_150px_auto_auto]"
                          >
                            <div>
                              <label className="text-xs font-semibold">
                                Name
                              </label>

                              <input
                                value={
                                  value.name
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateOptionValue(
                                    optionIndex,
                                    valueIndex,
                                    "name",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="8 inch"
                                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold">
                                Extra price (€)
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  value.price
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateOptionValue(
                                    optionIndex,
                                    valueIndex,
                                    "price",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>

                            <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium">
                              <input
                                type="checkbox"
                                checked={
                                  value.available
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateOptionValue(
                                    optionIndex,
                                    valueIndex,
                                    "available",
                                    event
                                      .target
                                      .checked
                                  )
                                }
                                className="h-4 w-4"
                              />

                              Available
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                removeOptionValue(
                                  optionIndex,
                                  valueIndex
                                )
                              }
                              disabled={
                                option
                                  .values
                                  .length ===
                                1
                              }
                              className="self-end rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* ALLERGENS */}
      {/* ---------------------------------------------------------------- */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          Allergens
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Separate allergens with commas.
        </p>

        <input
          value={allergens}
          onChange={(event) =>
            setAllergens(
              event.target.value
            )
          }
          placeholder="Milk, Eggs, Gluten, Nuts"
          className="mt-5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SEO */}
      {/* ---------------------------------------------------------------- */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          SEO
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Optional search engine metadata.
        </p>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              htmlFor="seoTitle"
              className="text-sm font-semibold"
            >
              SEO Title
            </label>

            <input
              id="seoTitle"
              name="seoTitle"
              placeholder="Chocolate Birthday Cake | Cake Ireland"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="seoDescription"
              className="text-sm font-semibold"
            >
              SEO Description
            </label>

            <textarea
              id="seoDescription"
              name="seoDescription"
              rows={4}
              placeholder="Order a delicious chocolate birthday cake..."
              className="mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* STATUS */}
      {/* ---------------------------------------------------------------- */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          Status
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              name="published"
              value="true"
              className="h-4 w-4"
            />

            <div>
              <p className="text-sm font-semibold">
                Published
              </p>

              <p className="text-xs text-muted-foreground">
                Make this product visible in
                the shop.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              name="available"
              value="true"
              defaultChecked
              className="h-4 w-4"
            />

            <div>
              <p className="text-sm font-semibold">
                Available
              </p>

              <p className="text-xs text-muted-foreground">
                Allow customers to purchase
                this product.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* ERROR */}
      {/* ---------------------------------------------------------------- */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* ACTIONS */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/products"
            )
          }
          disabled={loading || uploadsInProgress > 0}
          className="rounded-lg border px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating..."
            : uploadsInProgress > 0
              ? "Uploading images..."
              : "Create product"}
        </button>
      </div>
    </form>
  );
}