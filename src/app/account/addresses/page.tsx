import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { AddressBook } from "@/components/account/address-book";
import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AccountAddressesPage() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Faccount%2Faddresses");
  }

  const addresses = await prisma.address.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      county: true,
      eircode: true,
      phone: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="min-h-[70vh] py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-3xl">
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
            My addresses
          </h1>
          <p className="mt-2 text-muted-foreground">
            Save and manage your delivery addresses.
          </p>

          <AddressBook addresses={addresses} />
        </div>
      </Container>
    </main>
  );
}
