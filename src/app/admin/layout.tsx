import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <>
      <AdminNavigation />
      {children}
    </>
  );
}