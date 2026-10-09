"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SetFavoriteResult =
  | {
      success: true;
      saved: boolean;
    }
  | {
      success: false;
      error: string;
    };

export async function setFavorite(
  productId: string,
  saved: boolean
): Promise<SetFavoriteResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Sign in to save favorite products.",
    };
  }

  if (
    typeof productId !== "string" ||
    productId.length === 0 ||
    typeof saved !== "boolean"
  ) {
    return {
      success: false,
      error: "Invalid favorite request.",
    };
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      published: true,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    return {
      success: false,
      error: "This product is no longer available.",
    };
  }

  if (saved) {
    await prisma.favorite.createMany({
      data: {
        userId: session.user.id,
        productId: product.id,
      },
      skipDuplicates: true,
    });
  } else {
    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        productId: product.id,
      },
    });
  }

  return {
    success: true,
    saved,
  };
}
