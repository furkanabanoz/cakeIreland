import Link from "next/link";

import { Container } from "@/components/container";
import { CookiePreferencesButton } from "@/components/analytics/cookie-preferences-button";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/40">
      <Container>
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="text-lg font-semibold">CakeIreland</h2>

            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Beautiful cakes and desserts made for your special moments.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Shop</h3>

            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/shop" className="hover:text-primary">
                Shop All
              </Link>

              <Link href="/shop?q=birthday" className="hover:text-primary">
                Birthday Cakes
              </Link>

              <Link href="/shop?q=wedding" className="hover:text-primary">
                Wedding Cakes
              </Link>

              <Link href="/shop?q=cupcakes" className="hover:text-primary">
                Cupcakes
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Customer</h3>

            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/account" className="hover:text-primary">
                My Account
              </Link>

              <Link href="/delivery" className="hover:text-primary">
                Delivery
              </Link>

              <Link href="/contact" className="hover:text-primary">
                Contact
              </Link>

            </div>
          </div>

          <div>
            <h3 className="font-semibold">Information</h3>

            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary">
                Privacy
              </Link>

              <Link href="/cookies" className="hover:text-primary">
                Cookies
              </Link>

              <CookiePreferencesButton />

              <Link href="/terms" className="hover:text-primary">
                Terms
              </Link>

              <Link href="/refund" className="hover:text-primary">
                Refund Policy
              </Link>

              <Link href="/allergens" className="hover:text-primary">
                Allergens
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t py-6 text-center text-sm text-muted-foreground">
          © 2026 CakeIreland. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
