"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  deleteProduct,
  publishProduct,
  unpublishProduct,
  updateProduct,
} from "@/actions/product";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { parseAdminOptionValues } from "@/lib/admin-option-values";

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface ProductOptionValue {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

type ProductOptionType =
  | "SIZE"
  | "FLAVOUR"
  | "DECORATION"
  | "EXTRA";

interface ProductOption {
  id: string;
  name: string;
  type: ProductOptionType;
  required: boolean;
  sortOrder: number;
  values: ProductOptionValue[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  categoryId: string;
  preparationTime: number;
  allergens: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  available: boolean;
  published: boolean;
  images: ProductImage[];
  options: ProductOption[];
}

interface EditProductFormProps {
  product: Product;
  categories: Category[];
}

interface ImageState {
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface OptionValueState {
  name: string;
  price: string;
  available: boolean;
}

interface OptionState {
  name: string;
  type: ProductOptionType;
  required: boolean;
  values: OptionValueState[];
  bulkValues: string;
}

const optionTypes: ProductOptionType[] = [
  "SIZE",
  "FLAVOUR",
  "DECORATION",
  "EXTRA",
];

function isProductOptionType(
  value: string
): value is ProductOptionType {
  return optionTypes.includes(value as ProductOptionType);
}

export function EditProductForm({
  product,
  categories,
}: EditProductFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description);

  const [basePrice, setBasePrice] = useState(
    String(product.basePrice)
  );

  const [categoryId, setCategoryId] = useState(
    product.categoryId
  );

  const [preparationTime, setPreparationTime] = useState(
    String(product.preparationTime)
  );

  const [allergens, setAllergens] = useState(
    product.allergens.join(", ")
  );

  const [seoTitle, setSeoTitle] = useState(
    product.seoTitle ?? ""
  );

  const [seoDescription, setSeoDescription] = useState(
    product.seoDescription ?? ""
  );

  const [published, setPublished] = useState(
    product.published
  );

  const [available, setAvailable] = useState(
    product.available
  );

  const [images, setImages] = useState<ImageState[]>(
    product.images.map((image) => ({
      url: image.url,
      alt: image.alt ?? "",
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    }))
  );

  const [options, setOptions] = useState<OptionState[]>(
    product.options.map((option) => ({
      name: option.name,
      type: option.type,
      required: option.required,
      bulkValues: "",
      values: option.values.map((value) => ({
        name: value.name,
        price: String(value.price),
        available: value.available,
      })),
    }))
  );

  function addImage() {
    setImages((current) => [
      ...current,
      {
        url: "",
        alt: "",
        sortOrder: current.length,
        isPrimary: current.length === 0,
      },
    ]);
  }

  function removeImage(index: number) {
    setImages((current) => {
      const next = current.filter(
        (_, imageIndex) => imageIndex !== index
      );

      if (
        next.length > 0 &&
        !next.some((image) => image.isPrimary)
      ) {
        next[0] = {
          ...next[0],
          isPrimary: true,
        };
      }

      return next.map((image, imageIndex) => ({
        ...image,
        sortOrder: imageIndex,
      }));
    });
  }

  function updateImage(
    index: number,
    field: keyof ImageState,
    value: string | boolean | number
  ) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              [field]: value,
            }
          : image
      )
    );
  }

  function setPrimaryImage(index: number) {
    setImages((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      }))
    );
  }

  function addOption() {
    setOptions((current) => [
      ...current,
      {
        name: "",
        type: "SIZE",
        required: false,
        values: [],
        bulkValues: "",
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

  function removeOption(index: number) {
    setOptions((current) =>
      current.filter(
        (_, optionIndex) => optionIndex !== index
      )
    );
  }

  function moveOption(index: number, direction: -1 | 1) {
    setOptions((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function updateOption(
    index: number,
    field: keyof OptionState,
    value: string | boolean
  ) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              [field]: value,
            }
          : option
      )
    );
  }

  function updateOptionType(
    index: number,
    value: string
  ) {
    if (!isProductOptionType(value)) {
      return;
    }

    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              type: value,
            }
          : option
      )
    );
  }

  function addOptionValue(optionIndex: number) {
    setOptions((current) =>
      current.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: [
                ...option.values,
                {
                  name: "",
                  price: "0",
                  available: true,
                },
              ],
            }
          : option
      )
    );
  }

  function removeOptionValue(
    optionIndex: number,
    valueIndex: number
  ) {
    setOptions((current) =>
      current.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: option.values.filter(
                (_, currentValueIndex) =>
                  currentValueIndex !== valueIndex
              ),
            }
          : option
      )
    );
  }

  function updateOptionValue(
    optionIndex: number,
    valueIndex: number,
    field: keyof OptionValueState,
    value: string | boolean
  ) {
    setOptions((current) =>
      current.map(
        (option, currentOptionIndex) =>
          currentOptionIndex === optionIndex
            ? {
                ...option,
                values: option.values.map(
                  (
                    optionValue,
                    currentValueIndex
                  ) =>
                    currentValueIndex === valueIndex
                      ? {
                          ...optionValue,
                          [field]: value,
                        }
                      : optionValue
                ),
              }
            : option
      )
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (uploadsInProgress > 0) {
      setError("Wait for image uploads to finish before saving.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleanName = name.trim();
    const cleanSlug = slug.trim();
    const cleanDescription = description.trim();

    const numericPrice = Number(basePrice);
    const numericPreparationTime = Number(
      preparationTime
    );

    if (!cleanName) {
      setError("Product name is required.");
      setLoading(false);
      return;
    }

    if (!cleanSlug) {
      setError("Product slug is required.");
      setLoading(false);
      return;
    }

    if (!cleanDescription) {
      setError("Product description is required.");
      setLoading(false);
      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError("Invalid product price.");
      setLoading(false);
      return;
    }

    if (
      !Number.isInteger(numericPreparationTime) ||
      numericPreparationTime < 0
    ) {
      setError("Invalid preparation time.");
      setLoading(false);
      return;
    }

    if (!categoryId) {
      setError("Product category is required.");
      setLoading(false);
      return;
    }

    const cleanImages = images
      .map((image, index) => ({
        url: image.url.trim(),
        alt: image.alt.trim() || undefined,
        sortOrder: index,
        isPrimary: image.isPrimary,
      }))
      .filter((image) => image.url);

    if (
      cleanImages.length > 0 &&
      !cleanImages.some((image) => image.isPrimary)
    ) {
      cleanImages[0].isPrimary = true;
    }

    const cleanOptions = options
      .map((option, optionIndex) => ({
        name: option.name.trim(),
        type: option.type,
        required: option.required,
        sortOrder: optionIndex,
        values: option.values
          .map((value) => ({
            name: value.name.trim(),
            price: Number(value.price),
            available: value.available,
          }))
          .filter((value) => value.name),
      }))
      .filter((option) => option.name);

    for (const option of cleanOptions) {
      for (const value of option.values) {
        if (
          !Number.isFinite(value.price) ||
          value.price < 0
        ) {
          setError(
            `Invalid price for option "${value.name}".`
          );
          setLoading(false);
          return;
        }
      }
    }

    const cleanAllergens = allergens
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const result = await updateProduct(product.id, {
        name: cleanName,
        slug: cleanSlug,
        description: cleanDescription,
        basePrice: numericPrice,
        categoryId,
        preparationTime: numericPreparationTime,
        allergens: cleanAllergens,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription:
          seoDescription.trim() || undefined,
        available,
        published,
        images: cleanImages,
        options: cleanOptions,
      });

      if (!result.success) {
        setError(
          result.error ?? "Failed to update product."
        );
        setLoading(false);
        return;
      }

      setSuccess("Product updated successfully.");

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update product."
      );

      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteProduct(product.id);

      if (!result.success) {
        setError(
          result.error ?? "Failed to delete product."
        );
        setDeleting(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );

      setDeleting(false);
    }
  }

  async function handlePublishToggle() {
    setStatusLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = published
        ? await unpublishProduct(product.id)
        : await publishProduct(product.id);

      if (!result.success) {
        setError(
          result.error ??
            "Failed to update publishing status."
        );
        setStatusLoading(false);
        return;
      }

      const nextPublished = !published;

      setPublished(nextPublished);

      setSuccess(
        nextPublished
          ? "Product published successfully."
          : "Product unpublished successfully."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update publishing status."
      );
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic information */}

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
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
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
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value)
                }
                required
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
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
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                required
                rows={5}
                className="mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}

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
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(event) =>
                  setBasePrice(event.target.value)
                }
                required
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
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
                required
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="preparationTime"
                className="text-sm font-semibold"
              >
                Preparation Time (minutes)
              </label>

              <input
                id="preparationTime"
                type="number"
                min="0"
                step="1"
                value={preparationTime}
                onChange={(event) =>
                  setPreparationTime(
                    event.target.value
                  )
                }
                required
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        {/* Images */}

        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Images
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add product image URLs and choose a
                primary image.
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
            {images.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No images added.
              </p>
            ) : (
              images.map((image, index) => (
                <div
                  key={index}
                  className="rounded-xl border p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div>
                      <label className="text-xs font-semibold">
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
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
                      <label className="text-xs font-semibold">
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
                        placeholder="Chocolate cake"
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() =>
                          removeImage(index)
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <label className="mt-4 flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="primary-image"
                      checked={image.isPrimary}
                      onChange={() =>
                        setPrimaryImage(index)
                      }
                    />

                    Primary image
                  </label>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Options */}

        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Options & Extras
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Create as many ordered design steps as needed (for example,
                tiers, sponge, filling, frosting, colours or finishing touches).
                Name each step clearly, set its available choices and prices,
                and mark it required when customers must answer it. Extra-type
                steps allow multiple selections in one group, but fillings
                cannot currently be assigned to individual tiers. Dietary
                labels such as vegan or gluten-free are customer preferences,
                not a guarantee against allergens or cross-contact. HEX values
                can be included in choice names but are not structured colour
                swatches.
              </p>
            </div>

            <button
              type="button"
              onClick={addOption}
              className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              + Add option
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {options.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No options added.
              </p>
            ) : (
              options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className="rounded-xl border p-5"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold">
                        Option name
                      </label>

                      <input
                        value={option.name}
                        onChange={(event) =>
                          updateOption(
                            optionIndex,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Size"
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold">
                        Type
                      </label>

                      <select
                        value={option.type}
                        onChange={(event) =>
                          updateOptionType(
                            optionIndex,
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        {optionTypes.map((type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={option.required}
                          onChange={(event) =>
                            updateOption(
                              optionIndex,
                              "required",
                              event.target.checked
                            )
                          }
                        />

                        Required
                      </label>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label={`Move ${option.name || "option"} up`}
                          disabled={optionIndex === 0}
                          onClick={() => moveOption(optionIndex, -1)}
                          className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${option.name || "option"} down`}
                          disabled={optionIndex === options.length - 1}
                          onClick={() => moveOption(optionIndex, 1)}
                          className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOption(optionIndex)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        Values
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add choices and set each extra price. Review availability before saving; customers only see saved, published product options.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          addOptionValue(optionIndex)
                        }
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        + Add value
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <label
                          className="text-xs font-semibold"
                          htmlFor={`bulk-option-${optionIndex}`}
                        >
                          Add many choices
                        </label>
                        <textarea
                          id={`bulk-option-${optionIndex}`}
                          value={option.bulkValues}
                          onChange={(event) =>
                            updateOption(
                              optionIndex,
                              "bulkValues",
                              event.target.value
                            )
                          }
                          rows={3}
                          placeholder={"Vanilla | 0\nChocolate | 2.50"}
                          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          One choice per line: name | extra price in €. Imported choices start available; review every price and availability below before saving.
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

                    <div className="mt-3 space-y-3">
                      {option.values.map(
                        (value, valueIndex) => (
                          <div
                            key={valueIndex}
                            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto_auto]"
                          >
                            <input
                              value={value.name}
                              onChange={(event) =>
                                updateOptionValue(
                                  optionIndex,
                                  valueIndex,
                                  "name",
                                  event.target.value
                                )
                              }
                              placeholder="Large"
                              className="rounded-lg border bg-background px-3 py-2 text-sm"
                            />

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={value.price}
                              onChange={(event) =>
                                updateOptionValue(
                                  optionIndex,
                                  valueIndex,
                                  "price",
                                  event.target.value
                                )
                              }
                              placeholder="0.00"
                              className="rounded-lg border bg-background px-3 py-2 text-sm"
                            />

                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={value.available}
                                onChange={(event) =>
                                  updateOptionValue(
                                    optionIndex,
                                    valueIndex,
                                    "available",
                                    event.target.checked
                                  )
                                }
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
                              className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-secondary"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}

                      {option.values.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No values added.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Allergens */}

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
              setAllergens(event.target.value)
            }
            placeholder="Milk, Eggs, Gluten, Nuts"
            className="mt-5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
          />
        </section>

        {/* SEO */}

        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">SEO</h2>

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
                value={seoTitle}
                onChange={(event) =>
                  setSeoTitle(event.target.value)
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
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
                value={seoDescription}
                onChange={(event) =>
                  setSeoDescription(
                    event.target.value
                  )
                }
                rows={4}
                className="mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Status */}

        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            Status
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) =>
                  setPublished(event.target.checked)
                }
                className="h-4 w-4"
              />

              <div>
                <p className="text-sm font-semibold">
                  Published
                </p>

                <p className="text-xs text-muted-foreground">
                  Make this product visible in the shop.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                checked={available}
                onChange={(event) =>
                  setAvailable(event.target.checked)
                }
                className="h-4 w-4"
              />

              <div>
                <p className="text-sm font-semibold">
                  Available
                </p>

                <p className="text-xs text-muted-foreground">
                  Allow customers to purchase this
                  product.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Messages */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* Actions */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={
              loading ||
              deleting ||
              statusLoading ||
              uploadsInProgress > 0
            }
            className="rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting
              ? "Deleting..."
              : "Delete product"}
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                router.push("/admin/products")
              }
              disabled={
                loading ||
                deleting ||
                statusLoading
              }
              className="rounded-lg border px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                deleting ||
                statusLoading
              }
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : uploadsInProgress > 0
                  ? "Uploading images..."
                  : "Save changes"}
            </button>
          </div>
        </div>
      </form>

      {/* Publishing */}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Publishing
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current status:{" "}
              <span className="font-semibold">
                {published
                  ? "Published"
                  : "Unpublished"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handlePublishToggle}
            disabled={
              statusLoading ||
              loading ||
              deleting
            }
            className={`rounded-lg px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              published
                ? "border border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {statusLoading
              ? "Updating..."
              : published
                ? "Unpublish"
                : "Publish"}
          </button>
        </div>
      </section>
    </div>
  );
}