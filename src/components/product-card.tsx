import Image from "next/image";
import Link from "next/link";

import { FavoriteButton } from "@/components/product/favorite-button";

interface ProductCardProps {
  productId?: string;
  name: string;
  price: number;
  href: string;
  image?: string;
  rating?: number;
  initiallyFavorited?: boolean;
  authenticated?: boolean;
}

export function ProductCard({
  productId,
  name,
  price,
  href,
  image,
  rating,
  initiallyFavorited = false,
  authenticated = false,
}: ProductCardProps) {
  return (
    <article className="group relative block overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
      {productId && (
        <FavoriteButton
          productId={productId}
          productName={name}
          initiallySaved={initiallyFavorited}
          authenticated={authenticated}
          floating
        />
      )}

      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden bg-accent/40">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              unoptimized={!image.startsWith("/")}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              🍰
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 font-semibold transition-colors group-hover:text-primary">
            {name}
          </h3>

          {rating !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-sm text-yellow-500">
                {"★".repeat(rating)}
              </span>

              <span className="text-xs text-muted-foreground">
                ({rating}.0)
              </span>
            </div>
          )}

          <p className="mt-2 font-semibold text-primary">
            From €{price}
          </p>
        </div>
      </Link>
    </article>
  );
}
