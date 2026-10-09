"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const reviewInputSchema = z.object({
  productId: z.string().min(1).max(128),
  orderId: z.string().min(1).max(128),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10).max(3000),
});

type ReviewSubmissionResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      message: string;
    };

export async function submitReview(
  input: unknown
): Promise<ReviewSubmissionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sign in to review a product.",
    };
  }

  const parsed = reviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a rating and a review between 10 and 3,000 characters.",
    };
  }

  const limit = await checkRateLimit({
    key: `review:${session.user.id}`,
    userId: session.user.id,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!limit.allowed) {
    return {
      success: false,
      error: "Too many review submissions. Try again later.",
    };
  }

  const purchase = await prisma.order.findFirst({
    where: {
      id: parsed.data.orderId,
      userId: session.user.id,
      status: {
        in: [
          "PAID",
          "CONFIRMED",
          "PREPARING",
          "READY",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
        ],
      },
      payment: {
        is: {
          status: "PAID",
        },
      },
      items: {
        some: {
          productId: parsed.data.productId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!purchase) {
    return {
      success: false,
      error: "A paid order for this product is required to submit a review.",
    };
  }

  try {
    await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: parsed.data.productId,
        orderId: purchase.id,
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        body: parsed.data.body,
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "You have already reviewed this product for this order.",
      };
    }

    throw error;
  }

  return {
    success: true,
    message:
      "Thank you. Your review will appear after it has been checked.",
  };
}
