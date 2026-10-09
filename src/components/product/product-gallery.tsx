"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-accent/40">
        {activeImage ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || productName}
            fill
            priority={activeIndex === 0}
            unoptimized={!activeImage.url.startsWith("/")}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`${productName} image unavailable`}
            className="flex h-full items-center justify-center text-8xl sm:text-9xl"
          >
            🍰
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="mt-3 grid grid-cols-5 gap-3"
          aria-label={`${productName} image gallery`}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={activeIndex === index}
              className={`relative aspect-square overflow-hidden rounded-xl bg-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                activeIndex === index ? "ring-2 ring-primary" : ""
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized={!image.url.startsWith("/")}
                sizes="(max-width: 640px) 20vw, 10vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
