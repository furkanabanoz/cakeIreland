import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { AccountSettingsForm } from "@/components/account/account-settings-form";
import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AccountSettingsPage() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Faccount%2Fsettings");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-2xl">
          <Link
            href="/account"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to account
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">
            My Account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Account settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Update the name and phone number used on your account.
          </p>

          <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
            <AccountSettingsForm
              name={user.name ?? ""}
              email={user.email}
              phone={user.phone ?? ""}
            />
          </section>
        </div>
      </Container>
    </main>
  );
}
