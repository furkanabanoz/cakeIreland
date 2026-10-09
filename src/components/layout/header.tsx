import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Heart, User } from "lucide-react";

import { Container } from "@/components/container";
import { prisma } from "@/lib/prisma";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { CartIndicator } from "@/components/cart/cart-indicator";

async function CategoryNavigation() {
  await connection();
  const categories = await prisma.category.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, slug: true },
  });

  return (
    <>
      <DesktopNav categories={categories} />
      <MobileNav categories={categories} />
    </>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight sm:text-2xl"
          >
            CakeIreland
          </Link>

          <Suspense
            fallback={
              <>
                <DesktopNav categories={[]} />
                <MobileNav categories={[]} />
              </>
            }
          >
            <CategoryNavigation />
          </Suspense>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/account/favorites"
              aria-label="Favorites"
              className="rounded-md p-2 hover:bg-accent"
            >
              <Heart className="size-5" />
            </Link>

            <Link
              href="/account"
              aria-label="Account"
              className="rounded-md p-2 hover:bg-accent"
            >
              <User className="size-5" />
            </Link>

            <CartIndicator />
          </div>
        </div>
      </Container>
    </header>
  );
}
