"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setFavorite } from "@/actions/favorites";

interface FavoriteButtonProps {
  productId: string;
  productName: string;
  initiallySaved: boolean;
  authenticated: boolean;
  floating?: boolean;
}

export function FavoriteButton({
  productId,
  productName,
  initiallySaved,
  authenticated,
  floating = false,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleFavorite() {
    if (!authenticated) {
      const callbackUrl = window.location.pathname;
      router.push(
        `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
      return;
    }

    const nextSaved = !saved;
    setError("");

    startTransition(async () => {
      const result = await setFavorite(productId, nextSaved);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSaved(result.saved);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={
          saved
            ? `Remove ${productName} from favorites`
            : `Add ${productName} to favorites`
        }
        aria-pressed={saved}
        disabled={isPending}
        onClick={toggleFavorite}
        className={`inline-flex size-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow transition-colors hover:text-primary disabled:opacity-60 ${
          floating ? "absolute right-3 top-3 z-10" : "mt-4"
        }`}
      >
        <Heart
          className={`size-5 ${saved ? "fill-current text-primary" : ""}`}
        />
      </button>

      <span className="sr-only" aria-live="polite">
        {error}
      </span>
    </>
  );
}
