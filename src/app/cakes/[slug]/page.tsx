import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

import { Container } from "@/components/container";
import { ProductCard } from "@/components/product-card";
import { CustomizationForm } from "@/components/product/customization-form";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductGallery } from "@/components/product/product-gallery";
import { ReviewForm } from "@/components/product/review-form";
import { EventTracker } from "@/components/analytics/event-tracker";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";

export const instant = false;

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: {
      published: true,
    },
    select: {
      slug: true,
    },
  });

  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: {
      slug,
      published: true,
    },
    select: {
      name: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
        select: {
          url: true,
          alt: true,
        },
      },
    },
  });

  if (!product) {
    return {
      title: "Product not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = product.seoTitle || product.name;
  const description =
    product.seoDescription || product.description;
  const url = `/cakes/${slug}`;
  const image = product.images[0];

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      ...(image
        ? {
            images: [
              {
                url: image.url,
                alt: image.alt || product.name,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  await connection();
  const { slug } = await params;
  const session = await auth();

  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    include: {
      category: true,
      images: {
        orderBy: [
          { isPrimary: "desc" },
          { sortOrder: "asc" },
        ],
      },
      favorites: {
        where: {
          userId: session?.user?.id ?? "",
        },
        select: {
          userId: true,
        },
      },
      reviews: {
        where: {
          status: "APPROVED",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      options: {
        include: {
          values: {
            where: {
              available: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!product || !product.published) {
    notFound();
  }

  const reviewableOrders = session?.user?.id
    ? await prisma.order.findMany({
        where: {
          userId: session.user.id,
          status: {
            in: [
              "PAID",
              "CONFIRMED",
              "PREPARING",
              "READY",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
            ],
          },
          payment: {
            is: {
              status: "PAID",
            },
          },
          items: {
            some: {
              productId: product.id,
            },
          },
          reviews: {
            none: {
              userId: session.user.id,
              productId: product.id,
            },
          },
        },
        select: {
          id: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  const relatedProducts = await prisma.product.findMany({
    where: {
      published: true,
      categoryId: product.categoryId,
      id: {
        not: product.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
    include: {
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
      },
      favorites: {
        where: {
          userId: session?.user?.id ?? "",
        },
        select: {
          userId: true,
        },
      },
    },
  });

  const productUrl = absoluteUrl(`/cakes/${product.slug}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.seoDescription || product.description,
      image: product.images.map((image) => image.url),
      url: productUrl,
      brand: {
        "@type": "Brand",
        name: "CakeIreland",
      },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "EUR",
        price: Number(product.basePrice).toFixed(2),
        availability: product.available
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      ...(product.reviews.length > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue:
                product.reviews.reduce(
                  (sum, review) => sum + review.rating,
                  0
                ) / product.reviews.length,
              reviewCount: product.reviews.length,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Shop",
          item: absoluteUrl("/shop"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: product.name,
          item: productUrl,
        },
      ],
    },
  ];

  return (
    <main>
      <EventTracker
        eventName="view_item"
        parameters={{
          currency: "EUR",
          value: Number(product.basePrice),
          items: [
            {
              item_id: product.id,
              item_name: product.name,
              price: Number(product.basePrice),
              quantity: 1,
            },
          ],
        }}
      />
      {jsonLd.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(schema),
          }}
        />
      ))}
      <section className="py-8 sm:py-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Product Image */}
            <ProductGallery
              images={product.images}
              productName={product.name}
            />

            {/* Product Information */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                {product.category.name}
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                {product.name}
              </h1>

              <FavoriteButton
                productId={product.id}
                productName={product.name}
                initiallySaved={
                  product.favorites.length > 0
                }
                authenticated={Boolean(session?.user?.id)}
              />

              <p className="mt-6 text-2xl font-bold">
                From €{Number(product.basePrice)}
              </p>

              <p className="mt-6 leading-7 text-muted-foreground">
                {product.description}
              </p>

              <CustomizationForm
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.basePrice),
                  available: product.available,
                  options: product.options.map((option) => ({
                    id: option.id,
                    name: option.name,
                    type: option.type,
                    required: option.required,
                    sortOrder: option.sortOrder,
                    values: option.values.map((value) => ({
                      name: value.name,
                      price: Number(value.price),
                    })),
                  })),
                }}
              />

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Delivery and collection options are
                available during checkout.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t py-12 sm:py-16">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight">
              Customer reviews
            </h2>

            {product.reviews.length > 0 ? (
              <div className="mt-6 divide-y rounded-2xl border">
                {product.reviews.map((review) => (
                  <article key={review.id} className="p-5 sm:p-6">
                    <div
                      className="text-yellow-500"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {"★".repeat(review.rating)}
                      <span className="sr-only">
                        {review.rating} out of 5 stars
                      </span>
                    </div>
                    {review.title && (
                      <h3 className="mt-2 font-semibold">
                        {review.title}
                      </h3>
                    )}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {review.body}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {review.user.name || "Verified customer"} ·{" "}
                      {new Intl.DateTimeFormat("en-IE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(review.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No reviews yet.
              </p>
            )}

            {reviewableOrders.length > 0 && (
              <div className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
                <h3 className="text-lg font-semibold">
                  Write a review
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reviews are accepted from customers with a paid order
                  containing this product and are checked before publishing.
                </p>
                <ReviewForm
                  productId={product.id}
                  orderIds={reviewableOrders.map((order) => order.id)}
                />
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t bg-secondary/30 py-16">
          <Container>
            <h2 className="text-3xl font-bold tracking-tight">
              You may also like
            </h2>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map(
                (relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    productId={relatedProduct.id}
                    name={relatedProduct.name}
                    price={Number(
                      relatedProduct.basePrice
                    )}
                    href={`/cakes/${relatedProduct.slug}`}
                    image={relatedProduct.images[0]?.url}
                    initiallyFavorited={
                      relatedProduct.favorites.length > 0
                    }
                    authenticated={Boolean(
                      session?.user?.id
                    )}
                  />
                )
              )}
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}
