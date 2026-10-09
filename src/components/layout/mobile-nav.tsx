"use client";

import { Heart, Menu, Search, User, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CartIndicator } from "@/components/cart/cart-indicator";

interface MobileNavProps {
  categories: { name: string; slug: string }[];
}

export function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          aria-label="Search"
          aria-expanded={searchOpen}
          className="rounded-md p-2 hover:bg-accent"
          onClick={() => setSearchOpen((isOpen) => !isOpen)}
        >
          <Search className="size-5" />
        </button>

        <Link
          href="/account/favorites"
          aria-label="Favorites"
          className="rounded-md p-2 hover:bg-accent"
        >
          <Heart className="size-5" />
        </Link>

        <CartIndicator />

        <button
          type="button"
          aria-label="Open menu"
          className="rounded-md p-2 hover:bg-accent"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {searchOpen && (
        <form
          action="/shop"
          method="GET"
          role="search"
          className="fixed inset-x-0 top-16 z-40 flex gap-2 border-b bg-background p-4 shadow-lg md:hidden"
        >
          <input
            type="search"
            name="q"
            autoFocus
            aria-label="Search cakes"
            placeholder="Search cakes..."
            className="h-11 min-w-0 flex-1 rounded-lg border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Search
          </button>
          <button
            type="button"
            aria-label="Close search"
            className="rounded-md p-2 hover:bg-accent"
            onClick={() => setSearchOpen(false)}
          >
            <X className="size-5" />
          </button>
        </form>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <span className="text-lg font-semibold">Menu</span>

            <button
              type="button"
              aria-label="Close menu"
              className="rounded-md p-2 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-lg px-4 py-3 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="rounded-lg px-4 py-3 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Shop
            </Link>

            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="rounded-lg px-4 py-3 hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                {category.name}
              </Link>
            ))}

            <Link
              href="/account/favorites"
              className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <Heart className="size-5" />
              Favorites
            </Link>

            <Link
              href="/account"
              className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <User className="size-5" />
              Account
            </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
