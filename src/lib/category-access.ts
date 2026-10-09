import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function canPreviewUnpublishedCategories(userId?: string) {
  const id = userId ?? (await auth())?.user?.id;
  if (!id) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}
