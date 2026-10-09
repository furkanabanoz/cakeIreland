import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmedEmail } from "@/lib/email";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecretValue =
  process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not configured."
  );
}

if (!webhookSecretValue) {
  throw new Error(
    "STRIPE_WEBHOOK_SECRET is not configured."
  );
}

const stripe = new Stripe(stripeSecretKey);

const stripeWebhookSecret =
  webhookSecretValue;

/**
 * Stripe webhook endpoint.
 *
 * IMPORTANT:
 * Stripe signature verification requires
 * the RAW request body.
 *
 * Do NOT use request.json().
 */
export async function POST(
  request: Request
) {
  try {
    console.log(
      "================================="
    );

    console.log(
      "STRIPE WEBHOOK RECEIVED"
    );

    console.log(
      "================================="
    );

    /*
    |--------------------------------------------------------------------------
    | READ RAW BODY
    |--------------------------------------------------------------------------
    */

    const body = await request.text();

    const signature =
      request.headers.get(
        "stripe-signature"
      );

    if (!signature) {
      console.error(
        "STRIPE WEBHOOK: Missing stripe-signature header."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Missing Stripe signature.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY STRIPE SIGNATURE
    |--------------------------------------------------------------------------
    */

    let event: Stripe.Event;

    try {
      event =
        stripe.webhooks.constructEvent(
          body,
          signature,
          stripeWebhookSecret
        );
    } catch (error) {
      console.error(
        "STRIPE WEBHOOK SIGNATURE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Stripe webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "STRIPE EVENT:",
      event.type
    );

    console.log(
      "STRIPE EVENT ID:",
      event.id
    );

    /*
    |--------------------------------------------------------------------------
    | CHECKOUT SESSION COMPLETED
    |--------------------------------------------------------------------------
    */

    if (
      event.type === "checkout.session.completed" ||
      event.type ===
        "checkout.session.async_payment_succeeded"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      console.log(
        "CHECKOUT SESSION:",
        {
          id: session.id,

          paymentStatus:
            session.payment_status,

          paymentIntent:
            typeof session.payment_intent ===
            "string"
              ? session.payment_intent
              : null,

          metadata:
            session.metadata,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | PAYMENT MUST BE PAID
      |--------------------------------------------------------------------------
      */

      if (
        session.payment_status !==
        "paid"
      ) {
        console.log(
          "CHECKOUT SESSION COMPLETED BUT PAYMENT IS NOT PAID.",
          {
            sessionId:
              session.id,

            paymentStatus:
              session.payment_status,
          }
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | GET ORDER ID
      |--------------------------------------------------------------------------
      */

      const orderId =
        session.metadata?.orderId;

      if (!orderId) {
        console.error(
          "STRIPE WEBHOOK: Missing orderId metadata."
        );

        return NextResponse.json(
          {
            received: false,
            message:
              "Checkout Session is missing orderId metadata.",
          },
          {
            status: 500,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | GET PAYMENT INTENT
      |--------------------------------------------------------------------------
      */

      const paymentIntentId =
        typeof session.payment_intent ===
        "string"
          ? session.payment_intent
          : null;

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

          include: {
            payment: true,
          },
        });

      if (!order) {
        console.error(
          "STRIPE WEBHOOK: Order not found.",
          orderId
        );

        return NextResponse.json(
          {
            received: false,
            message:
              "Order referenced by Checkout Session was not found.",
          },
          {
            status: 500,
          }
        );
      }

      console.log(
        "ORDER FOUND:",
        {
          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          orderStatus:
            order.status,

          paymentStatus:
            order.payment?.status ??
            null,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | PAYMENT RECORD MUST EXIST
      |--------------------------------------------------------------------------
      */

      if (!order.payment) {
        console.error(
          "STRIPE WEBHOOK: Order has no payment record.",
          orderId
        );

        /*
        |--------------------------------------------------------------------------
        | Do NOT create another payment here.
        |
        | /api/checkout already creates Payment.
        |--------------------------------------------------------------------------
        */

        return NextResponse.json(
          {
            received: false,
            message:
              "Order is missing its payment record.",
          },
          {
            status: 500,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | ALREADY PAID CHECK
      |--------------------------------------------------------------------------
      |
      | Fast path.
      |
      | Most duplicate Stripe webhook requests will
      | stop here.
      |--------------------------------------------------------------------------
      */

      if (
        order.status === "PAID" &&
        order.payment.status === "PAID"
      ) {
        console.log(
          "STRIPE WEBHOOK: Order already PAID."
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | NEVER TURN CANCELLED / REFUNDED INTO PAID
      |--------------------------------------------------------------------------
      */

      if (
        order.status ===
          "CANCELLED" ||
        order.status ===
          "REFUNDED"
      ) {
        console.warn(
          "STRIPE WEBHOOK: Order is CANCELLED or REFUNDED. Ignoring payment event.",
          {
            orderId,
            orderStatus:
              order.status,
          }
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | ATOMIC PAYMENT TRANSITION
      |--------------------------------------------------------------------------
      |
      | THIS IS THE IMPORTANT IDEMPOTENCY PART.
      |
      | We only change the payment from a non-PAID
      | state to PAID if it is still not PAID.
      |
      | If two webhook requests arrive simultaneously:
      |
      | Request A:
      |   updateMany => count 1
      |
      | Request B:
      |   updateMany => count 0
      |
      | Therefore only Request A is allowed to
      | continue with the confirmation email.
      |--------------------------------------------------------------------------
      */

      const paymentTransition =
        await prisma.$transaction(
          async (tx) => {
            const paymentUpdate =
              await tx.payment.updateMany({
                where: {
                  id: order.payment!.id,

                  status: {
                    not: "PAID",
                  },
                },

                data: {
                  status: "PAID",

                  stripeSessionId:
                    session.id,

                  stripePaymentId:
                    paymentIntentId,
                },
              });

            /*
            |--------------------------------------------------------------------------
            | Another webhook request already processed
            | this payment.
            |--------------------------------------------------------------------------
            */

            if (
              paymentUpdate.count === 0
            ) {
              return {
                processed: false,
              };
            }

            /*
            |--------------------------------------------------------------------------
            | Update order only after the payment transition
            | succeeded.
            |--------------------------------------------------------------------------
            */

            await tx.order.update({
              where: {
                id: orderId,
              },

              data: {
                status: "PAID",
              },
            });

            return {
              processed: true,
            };
          }
        );

      /*
      |--------------------------------------------------------------------------
      | DUPLICATE WEBHOOK
      |--------------------------------------------------------------------------
      */

      if (
        !paymentTransition.processed
      ) {
        console.log(
          "STRIPE WEBHOOK: Payment was already processed by another request."
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | PAYMENT SUCCESSFULLY TRANSITIONED
      |--------------------------------------------------------------------------
      */

      console.log(
        "STRIPE PAYMENT TRANSITIONED TO PAID.",
        {
          orderId,
          orderNumber:
            order.orderNumber,

          sessionId:
            session.id,

          paymentIntentId,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | EMAIL
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | Because only the request that successfully
      | transitions Payment -> PAID reaches this point,
      | duplicate Stripe webhook requests will NOT send
      | another confirmation email.
      |
      | However, there is still one remaining reliability
      | improvement for email:
      |
      | If the email provider fails after the payment
      | succeeds, this request cannot safely resend it
      | without an EmailLog / emailSentAt field.
      |
      | We will handle that in STEP 8 with a dedicated
      | email idempotency mechanism.
      |--------------------------------------------------------------------------
      */

      try {
        const emailResult =
          await sendPaymentConfirmedEmail({
            customerName:
              order.customerName,

            customerEmail:
              order.customerEmail,

            orderNumber:
              order.orderNumber,

            total:
              Number(order.total),
          });

        console.log(
          "PAYMENT CONFIRMATION EMAIL SENT:",
          emailResult
        );
      } catch (emailError) {
        console.error(
          "PAYMENT CONFIRMATION EMAIL FAILED:",
          emailError
        );

        /*
        |--------------------------------------------------------------------------
        | DO NOT throw.
        |
        | The payment has already been successfully
        | recorded.
        |--------------------------------------------------------------------------
        */

      }

      console.log(
        "================================="
      );

      console.log(
        "STRIPE PAYMENT SUCCESS:",
        {
          orderId,

          orderNumber:
            order.orderNumber,

          sessionId:
            session.id,

          paymentIntentId,
        }
      );

      console.log(
        "================================="
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECKOUT SESSION EXPIRED
    |--------------------------------------------------------------------------
    */

    if (
      event.type ===
      "checkout.session.expired"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      console.log(
        "CHECKOUT SESSION EXPIRED:",
        {
          sessionId:
            session.id,

          metadata:
            session.metadata,
        }
      );

      const orderId =
        session.metadata?.orderId;

      if (!orderId) {
        console.error(
          "STRIPE EXPIRED: Missing orderId metadata."
        );

        return NextResponse.json({
          received: true,
        });
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

          include: {
            payment: true,
          },
        });

      if (!order) {
        console.error(
          "STRIPE EXPIRED: Order not found.",
          orderId
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | NEVER CANCEL A PAID ORDER
      |--------------------------------------------------------------------------
      */

      if (
        order.status === "PAID" ||
        order.payment?.status ===
          "PAID"
      ) {
        console.log(
          "STRIPE EXPIRED: Order is already PAID."
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | NEVER CHANGE AN ORDER THAT MOVED BEYOND PAYMENT
      |--------------------------------------------------------------------------
      */

      if (
        order.status ===
          "CONFIRMED" ||
        order.status ===
          "PREPARING" ||
        order.status ===
          "READY" ||
        order.status ===
          "OUT_FOR_DELIVERY" ||
        order.status ===
          "DELIVERED"
      ) {
        console.log(
          "STRIPE EXPIRED: Order is already beyond payment stage.",
          {
            orderId,
            status:
              order.status,
          }
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | ATOMIC EXPIRED TRANSITION
      |--------------------------------------------------------------------------
      |
      | Only a payment that is still non-PAID can be
      | marked FAILED.
      |--------------------------------------------------------------------------
      */

      await prisma.$transaction(
        async (tx) => {
          if (order.payment) {
            await tx.payment.updateMany({
              where: {
                id:
                  order.payment.id,

                status: {
                  not: "PAID",
                },
              },

              data: {
                status: "FAILED",
              },
            });
          }

          await tx.order.updateMany({
            where: {
              id: orderId,

              status: "PENDING",
            },

            data: {
              status: "CANCELLED",
            },
          });
        }
      );

      console.log(
        "STRIPE EXPIRED: ORDER CANCELLED.",
        {
          orderId,

          orderNumber:
            order.orderNumber,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT INTENT SUCCEEDED
    |--------------------------------------------------------------------------
    |
    | We intentionally DO NOT update the order here.
    |
    | checkout.session.completed is the payment event
    | used by this Checkout implementation.
    |--------------------------------------------------------------------------
    */

    if (
      event.type ===
      "payment_intent.succeeded"
    ) {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      console.log(
        "PAYMENT INTENT SUCCEEDED:",
        {
          paymentIntentId:
            paymentIntent.id,

          metadata:
            paymentIntent.metadata,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT INTENT FAILED
    |--------------------------------------------------------------------------
    */

    if (
      event.type ===
      "payment_intent.payment_failed"
    ) {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      console.log(
        "PAYMENT INTENT FAILED:",
        {
          paymentIntentId:
            paymentIntent.id,

          failureMessage:
            paymentIntent
              .last_payment_error
              ?.message ?? null,

          metadata:
            paymentIntent.metadata,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | DO NOT CANCEL ORDER HERE.
      |
      | checkout.session.expired handles abandoned
      | Checkout sessions.
      |--------------------------------------------------------------------------
      */
    }

    /*
    |--------------------------------------------------------------------------
    | CHARGE REFUNDED
    |--------------------------------------------------------------------------
    */

    if (
      event.type ===
      "charge.refunded"
    ) {
      const charge =
        event.data.object as Stripe.Charge;

      console.log(
        "STRIPE CHARGE REFUNDED:",
        {
          chargeId:
            charge.id,

          paymentIntent:
            typeof charge.payment_intent ===
            "string"
              ? charge.payment_intent
              : null,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | We intentionally do not automatically modify
      | the order here.
      |
      | Refund processing should be handled through the
      | application's refund/admin flow.
      |--------------------------------------------------------------------------
      */
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "STRIPE WEBHOOK ERROR"
    );

    console.error(
      "================================="
    );

    console.error(error);

    if (error instanceof Error) {
      console.error(
        "ERROR MESSAGE:",
        error.message
      );

      console.error(
        "ERROR STACK:",
        error.stack
      );
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Return 500 so Stripe knows that processing failed
    | and can retry the webhook.
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: false,

        message:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}