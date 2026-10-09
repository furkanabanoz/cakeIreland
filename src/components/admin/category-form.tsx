"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createCategory,
  searchCategoryProducts,
  updateCategory,
} from "@/actions/category";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export interface CategoryProductSelection {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  image: string | null;
  featured: boolean;
}

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    heroImage: string | null;
    ctaText: string | null;
    ctaLink: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    published: boolean;
    featured: boolean;
    sortOrder: number;
  };
  initialProducts: CategoryProductSelection[];
}

type SearchProduct = Omit<CategoryProductSelection, "featured">;

export function CategoryForm({
  category,
  initialProducts,
}: CategoryFormProps) {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] =
    useState<CategoryProductSelection[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [heroImage, setHeroImage] = useState(category?.heroImage ?? "");
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const products = await searchCategoryProducts(search);
        if (requestId.current === currentRequest) {
          setResults(products);
        }
      } catch (searchError) {
        console.error("CATEGORY PRODUCT SEARCH ERROR:", searchError);
        if (requestId.current === currentRequest) {
          setError("Unable to search products right now.");
        }
      } finally {
        if (requestId.current === currentRequest) {
          setSearching(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  function addProduct(product: SearchProduct) {
    setSelectedProducts((selected) =>
      selected.some((item) => item.id === product.id)
        ? selected
        : [...selected, { ...product, featured: false }]
    );
  }

  function removeProduct(productId: string) {
    setSelectedProducts((selected) =>
      selected.filter((product) => product.id !== productId)
    );
  }

  function moveProduct(index: number, direction: -1 | 1) {
    setSelectedProducts((selected) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= selected.length) {
        return selected;
      }

      const reordered = [...selected];
      [reordered[index], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[index],
      ];
      return reordered;
    });
  }

  function toggleFeatured(productId: string) {
    setSelectedProducts((selected) =>
      selected.map((product) =>
        product.id === productId
          ? { ...product, featured: !product.featured }
          : product
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadingHeroImage) {
      setError("Wait for the hero image upload to finish before saving.");
      return;
    }
    setPending(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const action = category ? updateCategory : createCategory;
      const result = await action(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSaved(true);
      if (category) {
        router.refresh();
      } else {
        router.push(`/admin/categories/${result.id}/edit?saved=1`);
      }
    } catch (submitError) {
      console.error("CATEGORY FORM SUBMISSION ERROR:", submitError);
      setError("Unable to save this category. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {category && (
        <input type="hidden" name="categoryId" value={category.id} />
      )}
        <input type="hidden" name="heroImage" value={heroImage} />

      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Category details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={category?.name}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            URL slug
            <input
              name="slug"
              required
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Use lowercase letters, numbers and single hyphens."
              defaultValue={category?.slug}
              className="h-11 w-full rounded-lg border bg-background px-3 font-mono font-normal"
            />
            <span className="block text-xs font-normal text-muted-foreground">
              Public URL: /categories/{category?.slug || "your-slug"}
            </span>
          </label>

          <label className="space-y-2 text-sm font-medium sm:col-span-2">
            Description
            <textarea
              name="description"
              rows={4}
              maxLength={10000}
              defaultValue={category?.description ?? ""}
              className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Category landing page</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Hero title
            <input
              name="heroTitle"
              maxLength={160}
              defaultValue={category?.heroTitle ?? ""}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            Hero subtitle
            <input
              name="heroSubtitle"
              maxLength={300}
              defaultValue={category?.heroSubtitle ?? ""}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
          </label>

          <div className="space-y-2 text-sm font-medium sm:col-span-2">
            <label htmlFor="category-hero-image">Hero image URL</label>
            <input
              id="category-hero-image"
              type="text"
              maxLength={2048}
              placeholder="https://example.com/category-image.jpg"
              value={heroImage}
              onChange={(event) => setHeroImage(event.target.value)}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
            <ImageUploadField
              value={heroImage}
              onChange={setHeroImage}
              onUploadingChange={setUploadingHeroImage}
            />
            <span className="block text-xs font-normal text-muted-foreground">
              Keep using an HTTPS URL or site-relative path, or upload an image.
            </span>
          </div>

          <label className="space-y-2 text-sm font-medium">
            CTA button text
            <input
              name="ctaText"
              maxLength={80}
              defaultValue={category?.ctaText ?? ""}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            CTA link
            <input
              name="ctaLink"
              maxLength={2048}
              placeholder="/shop"
              defaultValue={category?.ctaLink ?? ""}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
            <span className="block text-xs font-normal text-muted-foreground">
              Use a site-relative path or an HTTPS link.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <div>
          <h2 className="text-lg font-semibold">Category products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search products, then arrange their order and choose which appear
            in the featured section.
          </p>
        </div>

        <label className="mt-5 block space-y-2 text-sm font-medium">
          Search products
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setError("");
              setSearch(event.target.value);
            }}
            placeholder="Search by product name or slug"
            className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
          />
        </label>

        <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border">
          {searching ? (
            <p className="p-4 text-sm text-muted-foreground">
              Searching products…
            </p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {search ? "No matching products." : "No products found."}
            </p>
          ) : (
            <ul className="divide-y">
              {results.map((product) => {
                const selected = selectedProducts.some(
                  (item) => item.id === product.id
                );
                return (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-4 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /cakes/{product.slug} ·{" "}
                        {product.published ? "Published" : "Unpublished"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={selected}
                      onClick={() => addProduct(product)}
                      className="shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {selected ? "Added" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <h3 className="mt-6 font-semibold">
          Selected products ({selectedProducts.length})
        </h3>
        {selectedProducts.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            No products selected. You can add products now or later.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {selectedProducts.map((product, index) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
              >
                {product.image ? (
                  <Image
                    src={product.image}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized={!product.image.startsWith("/")}
                    className="size-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex size-12 items-center justify-center rounded-lg bg-secondary"
                  >
                    🎂
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {index + 1}. {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.published ? "Published" : "Unpublished"}
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={product.featured}
                    onChange={() => toggleFeatured(product.id)}
                    className="size-4 accent-primary"
                  />
                  Featured
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${product.name} up`}
                    disabled={index === 0}
                    onClick={() => moveProduct(index, -1)}
                    className="rounded-md border px-2 py-1 text-sm disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${product.name} down`}
                    disabled={index === selectedProducts.length - 1}
                    onClick={() => moveProduct(index, 1)}
                    className="rounded-md border px-2 py-1 text-sm disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="rounded-md border px-2 py-1 text-xs font-semibold text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {selectedProducts.map((product) => (
          <input
            key={product.id}
            type="hidden"
            name="productIds"
            value={product.id}
          />
        ))}
        {selectedProducts
          .filter((product) => product.featured)
          .map((product) => (
            <input
              key={product.id}
              type="hidden"
              name="featuredProductIds"
              value={product.id}
            />
          ))}
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Publishing and search</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Display order
            <input
              name="sortOrder"
              type="number"
              min={0}
              max={100000}
              step={1}
              required
              defaultValue={category?.sortOrder ?? 0}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
          </label>

          <div className="flex flex-col justify-center gap-3">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                name="published"
                type="checkbox"
                defaultChecked={category?.published ?? true}
                className="size-4 accent-primary"
              />
              Published (visible to customers)
            </label>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                name="featured"
                type="checkbox"
                defaultChecked={category?.featured ?? false}
                className="size-4 accent-primary"
              />
              Featured category
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            SEO title
            <input
              name="seoTitle"
              maxLength={160}
              defaultValue={category?.seoTitle ?? ""}
              className="h-11 w-full rounded-lg border bg-background px-3 font-normal"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            SEO description
            <textarea
              name="seoDescription"
              rows={3}
              maxLength={300}
              defaultValue={category?.seoDescription ?? ""}
              className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
            />
          </label>
        </div>
      </section>

      {saved && category && (
        <p
          role="status"
          className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-medium text-green-800"
        >
          Category saved.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/categories"
          className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending || uploadingHeroImage}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : uploadingHeroImage
              ? "Uploading image..."
              : category
                ? "Save category"
                : "Create category"}
        </button>
      </div>
    </form>
  );
}
