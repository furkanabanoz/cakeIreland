import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { CookiePreferencesButton } from "@/components/analytics/cookie-preferences-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AccountPrivacyPage() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Faccount%2Fprivacy");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
      passwordHash: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Your account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Privacy and data
          </h1>

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Download your data</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Download a JSON copy of your account details, saved products,
              reviews and order history.
            </p>
            <a
              href="/api/account/data"
              className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm font-semibold"
            >
              Download my data
            </a>
          </section>

          <section className="mt-5 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Cookie preferences</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Analytics is optional. Change your preference at any time.
            </p>
            <div className="mt-4">
              <CookiePreferencesButton />
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Delete your account</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Deleting your account removes your login, saved addresses,
              favourites and reviews. Order records required for fulfilment or
              legal obligations are retained and disconnected from your account.
              This cannot be undone.
            </p>
            {user.passwordHash ? (
              <DeleteAccountForm />
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Account deletion for passwordless accounts must be requested
                through{" "}
                <Link className="underline" href="/contact">
                  customer support
                </Link>
                .
              </p>
            )}
          </section>

          <p className="mt-6 text-sm text-muted-foreground">
            For questions about personal data, see our{" "}
            <Link href="/privacy" className="underline">
              privacy notice
            </Link>{" "}
            or contact support.
          </p>
        </div>
      </Container>
    </main>
  );
}
