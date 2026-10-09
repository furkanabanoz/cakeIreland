import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to download your account data." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      addresses: true,
      favorites: {
        select: {
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          orderNumber: true,
          status: true,
          subtotal: true,
          discount: true,
          deliveryFee: true,
          total: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          deliveryAddress: true,
          deliveryType: true,
          deliveryDate: true,
          deliverySlot: true,
          notes: true,
          createdAt: true,
          items: {
            select: {
              productName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              customization: true,
            },
          },
          payment: {
            select: {
              status: true,
              amount: true,
              currency: true,
              createdAt: true,
            },
          },
        },
      },
      reviews: {
        select: {
          product: {
            select: {
              name: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
            },
          },
          rating: true,
          title: true,
          body: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Account not found." },
      { status: 404 }
    );
  }

  return new NextResponse(JSON.stringify(user, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cakeireland-account-data.json"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
