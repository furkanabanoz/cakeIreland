"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  sendOrderConfirmedEmail,
  sendPreparingEmail,
  sendReadyEmail,
  sendOutForDeliveryEmail,
  sendDeliveredEmail,
  sendCancelledEmail,
  sendRefundEmail,
} from "@/lib/email";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING: [
    "CANCELLED",
    "PAID",
  ],

  PAID: [
    "CONFIRMED",
    "CANCELLED",
    "REFUNDED",
  ],

  CONFIRMED: [
    "PREPARING",
    "CANCELLED",
  ],

  PREPARING: [
    "READY",
    "CANCELLED",
  ],

  READY: [
    "OUT_FOR_DELIVERY",
  ],

  OUT_FOR_DELIVERY: [
    "DELIVERED",
  ],

  DELIVERED: [],

  CANCELLED: [],

  REFUNDED: [],
};

/*
|--------------------------------------------------------------------------
| UPDATE ORDER STATUS
|--------------------------------------------------------------------------
*/

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
) {
  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATION
  |--------------------------------------------------------------------------
  */

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | AUTHORIZATION
  |--------------------------------------------------------------------------
  */

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const role = user?.role;

  if (role !== "ADMIN") {
    return {
      success: false,
      error: "You do not have permission to update orders.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE ORDER ID
  |--------------------------------------------------------------------------
  */

  if (!orderId) {
    return {
      success: false,
      error: "Order ID is required.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE STATUS
  |--------------------------------------------------------------------------
  */

  const validStatuses: OrderStatus[] = [
    "PENDING",
    "PAID",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  if (!validStatuses.includes(newStatus)) {
    return {
      success: false,
      error: "Invalid order status.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | FIND ORDER
  |--------------------------------------------------------------------------
  */

  const order =
    await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!order) {
    return {
      success: false,
      error: "Order not found.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SAME STATUS
  |--------------------------------------------------------------------------
  */

  if (order.status === newStatus) {
    return {
      success: false,
      error: `Order is already ${newStatus}.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CHECK STATUS TRANSITION
  |--------------------------------------------------------------------------
  */

  const allowedNextStatuses =
    allowedTransitions[
      order.status as OrderStatus
    ];

  if (
    !allowedNextStatuses.includes(
      newStatus
    )
  ) {
    return {
      success: false,
      error:
        `Order cannot move from ${order.status} to ${newStatus}.`,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE ORDER
  |--------------------------------------------------------------------------
  */

  const updatedOrder =
    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: newStatus,
      },
    });

  /*
  |--------------------------------------------------------------------------
  | LOG
  |--------------------------------------------------------------------------
  */

  console.log(
    "ORDER STATUS UPDATED:",
    {
      orderId:
        updatedOrder.id,

      orderNumber:
        updatedOrder.orderNumber,

      previousStatus:
        order.status,

      newStatus:
        updatedOrder.status,

      updatedBy:
        session.user.id,

      role,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | EMAIL DATA
  |--------------------------------------------------------------------------
  */

  const emailData = {
    customerName:
      updatedOrder.customerName,

    customerEmail:
      updatedOrder.customerEmail,

    orderNumber:
      updatedOrder.orderNumber,

    total:
      Number(updatedOrder.total),
  };

  /*
  |--------------------------------------------------------------------------
  | SEND STATUS EMAIL
  |--------------------------------------------------------------------------
  */

  try {
    switch (newStatus) {
      case "CONFIRMED":
        await sendOrderConfirmedEmail(
          emailData
        );

        console.log(
          "ORDER EMAIL SENT: CONFIRMED"
        );

        break;

      case "PREPARING":
        await sendPreparingEmail(
          emailData
        );

        console.log(
          "ORDER EMAIL SENT: PREPARING"
        );

        break;

      case "READY":
        await sendReadyEmail(
          emailData
        );

        console.log(
          "ORDER EMAIL SENT: READY"
        );

        break;

      case "OUT_FOR_DELIVERY":
        await sendOutForDeliveryEmail(
          emailData
        );

        console.log(
          "ORDER EMAIL SENT: OUT_FOR_DELIVERY"
        );

        break;

      case "DELIVERED":
        await sendDeliveredEmail(
          emailData
        );

        console.log(
          "ORDER EMAIL SENT: DELIVERED"
        );

        break;

      case "CANCELLED":
        await sendCancelledEmail(
          emailData
        );

        console.log(
          "ORDER EMAIL SENT: CANCELLED"
        );

        break;

      case "REFUNDED":
        await sendRefundEmail(
          emailData
        );

        console.log(
          "ORDER EMAIL SENT: REFUNDED"
        );

        break;

      default:
        break;
    }
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Email failure should NOT undo the successful
    | order status update.
    |
    */

    console.error(
      "ORDER STATUS EMAIL ERROR:",
      error
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  return {
    success: true,

    order: {
      id:
        updatedOrder.id,

      orderNumber:
        updatedOrder.orderNumber,

      status:
        updatedOrder.status,
    },
  };
}