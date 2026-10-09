"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const moderationSchema = z.object({
  reviewId: z.string().min(1).max(128),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function moderateReview(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (admin?.role !== "ADMIN") {
    throw new Error("You do not have permission to moderate reviews.");
  }

  const parsed = moderationSchema.safeParse({
    reviewId: formData.get("reviewId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error("Invalid review moderation request.");
  }

  const review = await prisma.review.update({
    where: {
      id: parsed.data.reviewId,
    },
    data: {
      status: parsed.data.status,
    },
    select: {
      product: {
        select: {
          slug: true,
        },
      },
    },
  });

  revalidatePath("/admin/reviews");
  revalidatePath(`/cakes/${review.product.slug}`);
}
