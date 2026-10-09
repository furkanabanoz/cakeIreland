import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth";
import {
  calculateCouponDiscount,
  calculateOrderTotal,
  hasSlotCapacity,
  roundMoney,
} from "@/lib/checkout-calculations";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured.");
}

const stripe = new Stripe(stripeSecretKey);

type DeliveryType = "DELIVERY" | "COLLECTION";

class DeliverySlotUnavailableError extends Error {}

function generateOrderNumber() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `CI-${timestamp}-${random}`;
}

function cleanString(
  value: FormDataEntryValue | null
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseDeliveryDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toStripeAmount(value: number): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host");

  if (!host) {
    return false;
  }

  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol || new URL(request.url).protocol.slice(0, -1);

  try {
    return new URL(origin).origin === new URL(`${protocol}://${host}`).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let createdOrderId: string | null = null;

  try {
    if (!hasTrustedOrigin(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "This checkout request is not allowed.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be signed in to checkout.",
        },
        {
          status: 401,
        }
      );
    }

    const userId = session.user.id;
    const checkoutLimit = await checkRateLimit({
      key: `checkout:${userId}`,
      userId,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!checkoutLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many checkout attempts. Try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              checkoutLimit.retryAfterSeconds
            ),
          },
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FORM DATA
    |--------------------------------------------------------------------------
    */

    const formData = await request.formData();

    const firstName = cleanString(
      formData.get("firstName")
    );

    const lastName = cleanString(
      formData.get("lastName")
    );

    const email = cleanString(
      formData.get("email")
    ).toLowerCase();

    const phone = cleanString(
      formData.get("phone")
    );

    const deliveryTypeValue = cleanString(
      formData.get("deliveryType")
    );

    const addressLine1 = cleanString(
      formData.get("addressLine1")
    );

    const addressLine2 = cleanString(
      formData.get("addressLine2")
    );

    const city = cleanString(
      formData.get("city")
    );

    const county = cleanString(
      formData.get("county")
    );

    const eircode = cleanString(
      formData.get("eircode")
    ).toUpperCase();

    const deliveryZoneId = cleanString(
      formData.get("deliveryZoneId")
    );

    const deliveryDateValue = cleanString(
      formData.get("deliveryDate")
    );

    const deliverySlotId = cleanString(
      formData.get("deliverySlotId")
    );

    const couponCode = cleanString(
      formData.get("couponCode")
    ).toUpperCase();

    const notes = cleanString(
      formData.get("notes")
    );

    /*
    |--------------------------------------------------------------------------
    | BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "First name and last name are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !email ||
      !isValidEmail(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      deliveryTypeValue !== "DELIVERY" &&
      deliveryTypeValue !== "COLLECTION"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select delivery or collection.",
        },
        {
          status: 400,
        }
      );
    }

    const deliveryType =
      deliveryTypeValue as DeliveryType;

    /*
    |--------------------------------------------------------------------------
    | DELIVERY DATE
    |--------------------------------------------------------------------------
    */

    const deliveryDate =
      parseDeliveryDate(
        deliveryDateValue
      );

    if (!deliveryDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid delivery date.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PREVENT PAST DATES
    |--------------------------------------------------------------------------
    */

    const today = new Date();

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0
    );

    if (deliveryDate < todayStart) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select today or a future date.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedDateStart = new Date(deliveryDate);
    const selectedDateEnd = new Date(
      selectedDateStart.getTime() + 24 * 60 * 60 * 1000
    );

    /*
    |--------------------------------------------------------------------------
    | DELIVERY / COLLECTION SLOT
    |--------------------------------------------------------------------------
    */

    let selectedSlotName: string | null =
      null;
    let selectedDeliverySlotId: string | null = null;
    let selectedCollectionSlotId: string | null = null;

    if (deliveryType === "DELIVERY") {
      if (!deliverySlotId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a delivery time slot.",
          },
          {
            status: 400,
          }
        );
      }

      const deliverySlot =
        await prisma.deliverySlot.findFirst({
          where: {
            id: deliverySlotId,
            active: true,
          },
          select: {
            id: true,
            name: true,
          },
        });

      if (!deliverySlot) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a valid delivery time slot.",
          },
          {
            status: 400,
          }
        );
      }

      selectedSlotName =
        deliverySlot.name;
      selectedDeliverySlotId = deliverySlot.id;
    } else {
      if (!deliverySlotId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a collection time slot.",
          },
          {
            status: 400,
          }
        );
      }

      const collectionSlot =
        await prisma.collectionSlot.findFirst({
          where: {
            id: deliverySlotId,
            active: true,
          },
          select: {
            id: true,
            name: true,
          },
        });

      if (!collectionSlot) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a valid collection time slot.",
          },
          {
            status: 400,
          }
        );
      }

      selectedSlotName =
        collectionSlot.name;
      selectedCollectionSlotId = collectionSlot.id;
    }

    /*
    |--------------------------------------------------------------------------
    | DELIVERY ZONE
    |--------------------------------------------------------------------------
    */

    let deliveryFee = 0;

    let selectedDeliveryZone:
      | {
          id: string;
          name: string;
          fee: number;
        }
      | null = null;

    if (deliveryType === "DELIVERY") {
      if (!deliveryZoneId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a delivery area.",
          },
          {
            status: 400,
          }
        );
      }

      const zone =
        await prisma.deliveryZone.findFirst({
          where: {
            id: deliveryZoneId,
            active: true,
          },
          select: {
            id: true,
            name: true,
            fee: true,
          },
        });

      if (!zone) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected delivery area is no longer available.",
          },
          {
            status: 400,
          }
        );
      }

      deliveryFee = roundMoney(
        Number(zone.fee)
      );

      selectedDeliveryZone = {
        id: zone.id,
        name: zone.name,
        fee: deliveryFee,
      };

      if (!addressLine1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Delivery address is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!city) {
        return NextResponse.json(
          {
            success: false,
            message:
              "City is required for delivery.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE CART
    |--------------------------------------------------------------------------
    */

    const cart =
      await prisma.cart.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          items: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  basePrice: true,
                  available: true,
                  published: true,
                  categoryId: true,
                },
              },
            },
          },
        },
      });

    if (!cart) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your cart could not be found.",
        },
        {
          status: 400,
        }
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your cart is empty.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT + CART VALIDATION
    |--------------------------------------------------------------------------
    */

    for (const item of cart.items) {
      if (!item.product) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One of the products in your cart no longer exists.",
          },
          {
            status: 400,
          }
        );
      }

      if (!item.product.available) {
        return NextResponse.json(
          {
            success: false,
            message: `"${item.product.name}" is currently unavailable.`,
          },
          {
            status: 400,
          }
        );
      }

      if (!item.product.published) {
        return NextResponse.json(
          {
            success: false,
            message: `"${item.product.name}" is no longer available.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One of the quantities in your cart is invalid.",
          },
          {
            status: 400,
          }
        );
      }

      if (item.quantity > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The maximum quantity for one product is 100.",
          },
          {
            status: 400,
          }
        );
      }

      const unitPrice = Number(
        item.unitPrice
      );

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One of the prices in your cart is invalid.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | SERVER-SIDE SUBTOTAL
    |--------------------------------------------------------------------------
    */

    const subtotal = roundMoney(
      cart.items.reduce(
        (total, item) => {
          return (
            total +
            Number(item.unitPrice) *
              item.quantity
          );
        },
        0
      )
    );

    if (subtotal <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your cart total must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COUPON
    |--------------------------------------------------------------------------
    */

    let discount = 0;

    let appliedCoupon:
      | {
          id: string;
          code: string;
          freeDelivery: boolean;
        }
      | null = null;

    if (couponCode) {
      const coupon =
        await prisma.coupon.findUnique({
          where: {
            code: couponCode,
          },
          include: {
            products: {
              select: {
                productId: true,
              },
            },
            categories: {
              select: {
                categoryId: true,
              },
            },
          },
        });

      if (!coupon) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid coupon code.",
          },
          {
            status: 400,
          }
        );
      }

      if (!coupon.active) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon is no longer active.",
          },
          {
            status: 400,
          }
        );
      }

      const now = new Date();

      if (
        coupon.startsAt &&
        now < coupon.startsAt
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon is not active yet.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        coupon.expiresAt &&
        now > coupon.expiresAt
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon has expired.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usageCount >=
          coupon.usageLimit
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon has reached its usage limit.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        coupon.minimumOrder !== null &&
        subtotal <
          Number(coupon.minimumOrder)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Minimum order value for this coupon is €${Number(
              coupon.minimumOrder
            ).toFixed(2)}.`,
          },
          {
            status: 400,
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | FIRST ORDER
      |--------------------------------------------------------------------------
      */

      if (coupon.firstOrderOnly) {
        const previousOrder =
          await prisma.order.findFirst({
            where: {
              userId,
              status: {
                not: "CANCELLED",
              },
            },
            select: {
              id: true,
            },
          });

        if (previousOrder) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This coupon is only available for your first order.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | USER COUPON LIMIT
      |--------------------------------------------------------------------------
      */

      if (
        coupon.usageLimitPerUser !== null
      ) {
        const userUsageCount =
          await prisma.couponUsage.count({
            where: {
              couponId: coupon.id,
              userId,
            },
          });

        if (
          userUsageCount >=
          coupon.usageLimitPerUser
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "You have already used this coupon the maximum number of times.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | ELIGIBLE SUBTOTAL
      |--------------------------------------------------------------------------
      */

      let eligibleSubtotal =
        subtotal;

      if (
        coupon.scope === "PRODUCTS"
      ) {
        const allowedProducts =
          new Set(
            coupon.products.map(
              (item) =>
                item.productId
            )
          );

        eligibleSubtotal =
          roundMoney(
            cart.items.reduce(
              (total, item) => {
                if (
                  !allowedProducts.has(
                    item.productId
                  )
                ) {
                  return total;
                }

                return (
                  total +
                  Number(
                    item.unitPrice
                  ) *
                    item.quantity
                );
              },
              0
            )
          );

        if (
          eligibleSubtotal <= 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This coupon does not apply to the products in your cart.",
            },
            {
              status: 400,
            }
          );
        }
      }

      if (
        coupon.scope ===
        "CATEGORIES"
      ) {
        const allowedCategories =
          new Set(
            coupon.categories.map(
              (item) =>
                item.categoryId
            )
          );

        eligibleSubtotal =
          roundMoney(
            cart.items.reduce(
              (total, item) => {
                if (
                  !allowedCategories.has(
                    item.product.categoryId
                  )
                ) {
                  return total;
                }

                return (
                  total +
                  Number(
                    item.unitPrice
                  ) *
                    item.quantity
                );
              },
              0
            )
          );

        if (
          eligibleSubtotal <= 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This coupon does not apply to the products in your cart.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | DISCOUNT CALCULATION
      |--------------------------------------------------------------------------
      */

      discount = calculateCouponDiscount({
        type: coupon.type,
        value: Number(coupon.value),
        eligibleSubtotal,
        orderSubtotal: subtotal,
        maximumDiscount:
          coupon.maximumDiscount === null
            ? null
            : Number(coupon.maximumDiscount),
      });

      appliedCoupon = {
        id: coupon.id,
        code: coupon.code,
        freeDelivery:
          coupon.freeDelivery,
      };

      if (coupon.freeDelivery) {
        deliveryFee = 0;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | FINAL SERVER-SIDE TOTAL
    |--------------------------------------------------------------------------
    */

    const total = calculateOrderTotal({
      subtotal,
      discount,
      deliveryFee,
    });

    if (total <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The final order total must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DELIVERY ADDRESS SNAPSHOT
    |--------------------------------------------------------------------------
    */

    const deliveryAddress =
      deliveryType === "DELIVERY"
        ? {
            firstName,
            lastName,
            addressLine1,

            addressLine2:
              addressLine2 || null,

            city,

            county:
              county || null,

            eircode:
              eircode || null,

            phone:
              phone || null,

            deliveryZone:
              selectedDeliveryZone
                ? {
                    id:
                      selectedDeliveryZone.id,
                    name:
                      selectedDeliveryZone.name,
                    fee:
                      selectedDeliveryZone.fee,
                  }
                : null,
          }
        : null;

    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER
    |--------------------------------------------------------------------------
    */

    const order =
      await prisma.$transaction(
        async (tx) => {
          if (selectedDeliverySlotId) {
            const [slot] = await tx.$queryRaw<
              Array<{ capacity: number; active: boolean }>
            >`
              SELECT "capacity", "active"
              FROM "DeliverySlot"
              WHERE "id" = ${selectedDeliverySlotId}
              FOR UPDATE
            `;

            if (!slot?.active) {
              throw new DeliverySlotUnavailableError();
            }

            const bookedOrders = await tx.order.count({
              where: {
                deliveryType: "DELIVERY",
                deliveryDate: {
                  gte: selectedDateStart,
                  lt: selectedDateEnd,
                },
                status: {
                  notIn: ["CANCELLED", "REFUNDED"],
                },
                OR: [
                  {
                    deliverySlotId: selectedDeliverySlotId,
                  },
                  {
                    deliverySlotId: null,
                    deliverySlot: selectedSlotName,
                  },
                ],
              },
            });

            if (!hasSlotCapacity(bookedOrders, slot.capacity)) {
              throw new DeliverySlotUnavailableError();
            }
          } else if (selectedCollectionSlotId) {
            const [slot] = await tx.$queryRaw<
              Array<{ capacity: number; active: boolean }>
            >`
              SELECT "capacity", "active"
              FROM "CollectionSlot"
              WHERE "id" = ${selectedCollectionSlotId}
              FOR UPDATE
            `;

            if (!slot?.active) {
              throw new DeliverySlotUnavailableError();
            }

            const bookedOrders = await tx.order.count({
              where: {
                deliveryType: "COLLECTION",
                deliveryDate: {
                  gte: selectedDateStart,
                  lt: selectedDateEnd,
                },
                status: {
                  notIn: ["CANCELLED", "REFUNDED"],
                },
                OR: [
                  {
                    collectionSlotId: selectedCollectionSlotId,
                  },
                  {
                    collectionSlotId: null,
                    deliverySlot: selectedSlotName,
                  },
                ],
              },
            });

            if (!hasSlotCapacity(bookedOrders, slot.capacity)) {
              throw new DeliverySlotUnavailableError();
            }
          }

          const orderNumber =
            generateOrderNumber();

          const createdOrder =
            await tx.order.create({
              data: {
                orderNumber,

                user: {
                  connect: {
                    id: userId,
                  },
                },

                status: "PENDING",

                subtotal,
                discount,
                deliveryFee,
                total,

                customerName:
                  `${firstName} ${lastName}`.trim(),

                customerEmail:
                  email,

                customerPhone:
                  phone || null,

                deliveryAddress:
                  deliveryAddress ??
                  undefined,

                deliveryType,

                deliveryDate,

                deliverySlot:
                  selectedSlotName,
                ...(selectedDeliverySlotId
                  ? {
                      deliverySlotRecord: {
                        connect: {
                          id: selectedDeliverySlotId,
                        },
                      },
                    }
                  : {}),
                ...(selectedCollectionSlotId
                  ? {
                      collectionSlotRecord: {
                        connect: {
                          id: selectedCollectionSlotId,
                        },
                      },
                    }
                  : {}),

                notes:
                  notes || null,

                items: {
                  create:
                    cart.items.map(
                      (item) => ({
                        product: {
                          connect: {
                            id:
                              item.productId,
                          },
                        },

                        productName:
                          item.product.name,

                        quantity:
                          item.quantity,

                        unitPrice:
                          item.unitPrice,

                        totalPrice:
                          roundMoney(
                            Number(
                              item.unitPrice
                            ) *
                              item.quantity
                          ),

                        customization:
                          item.customization ??
                          undefined,
                      })
                    ),
                },

                payment: {
                  create: {
                    status:
                      "PENDING",
                    provider:
                      "stripe",
                    amount: total,
                    currency:
                      "EUR",
                  },
                },
              },

              include: {
                items: true,
                payment: true,
              },
            });

          return createdOrder;
        }
      );

    createdOrderId = order.id;

    /*
    |--------------------------------------------------------------------------
    | PAYMENT RECORD SAFETY CHECK
    |--------------------------------------------------------------------------
    */

    if (!order.payment) {
      console.error(
        "CHECKOUT: Order was created without a payment record.",
        order.id
      );

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      createdOrderId = null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create the payment record.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | STRIPE LINE ITEMS
    |--------------------------------------------------------------------------
    */

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart.items.map(
        (item) => ({
          quantity: item.quantity,

          price_data: {
            currency: "eur",

            product_data: {
              name:
                item.product.name,
            },

            unit_amount:
              toStripeAmount(
                Number(
                  item.unitPrice
                )
              ),
          },
        })
      );

    /*
    |--------------------------------------------------------------------------
    | STRIPE DISCOUNT
    |--------------------------------------------------------------------------
    */

    let stripeDiscount:
      | Stripe.Checkout.SessionCreateParams.Discount
      | undefined;

    let createdStripeCouponId:
      | string
      | null = null;

    if (discount > 0) {
      const stripeCoupon =
        await stripe.coupons.create({
          amount_off:
            toStripeAmount(
              discount
            ),

          currency: "eur",

          duration: "once",

          name: appliedCoupon
            ? `Coupon ${appliedCoupon.code}`
            : "Order discount",

          metadata: {
            orderId: order.id,
          },
        });

      createdStripeCouponId =
        stripeCoupon.id;

      stripeDiscount = {
        coupon:
          stripeCoupon.id,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | DELIVERY FEE
    |--------------------------------------------------------------------------
    */

    if (deliveryFee > 0) {
      lineItems.push({
        quantity: 1,

        price_data: {
          currency: "eur",

          product_data: {
            name: "Delivery",
          },

          unit_amount:
            toStripeAmount(
              deliveryFee
            ),
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ORIGIN
    |--------------------------------------------------------------------------
    */

    const origin =
      request.headers.get(
        "origin"
      ) ||
      new URL(
        request.url
      ).origin;

    /*
    |--------------------------------------------------------------------------
    | STRIPE CHECKOUT SESSION
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Do NOT add payment_method_types here.
    | Stripe's current typings do not accept it
    | in this project configuration.
    |--------------------------------------------------------------------------
    */

    let stripeSession:
      Stripe.Checkout.Session;

    try {
      stripeSession =
        await stripe.checkout.sessions.create(
          {
            mode: "payment",

            line_items: lineItems,
            expires_at: Math.floor(Date.now() / 1000) + 31 * 60,

            ...(stripeDiscount
              ? {
                  discounts: [
                    stripeDiscount,
                  ],
                }
              : {}),

            customer_email:
              email,

            metadata: {
              orderId:
                order.id,

              orderNumber:
                order.orderNumber,

              userId,

              cartId:
                cart.id,
            },

            success_url:
              `${origin}/account/orders/${order.id}?payment=success`,

            cancel_url:
              `${origin}/account/orders/${order.id}?payment=cancelled`,

            billing_address_collection:
              "auto",
          }
        );
    } catch (stripeError) {
      console.error(
        "STRIPE SESSION CREATION FAILED:",
        stripeError
      );

      /*
      |--------------------------------------------------------------------------
      | MARK ORDER FAILED
      |--------------------------------------------------------------------------
      */

      await prisma.$transaction(
        async (tx) => {
          await tx.payment.updateMany({
            where: {
              orderId:
                order.id,
            },

            data: {
              status: "FAILED",
            },
          });

          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              status:
                "CANCELLED",
            },
          });
        }
      );

      /*
      |--------------------------------------------------------------------------
      | REMOVE TEMP STRIPE COUPON
      |--------------------------------------------------------------------------
      */

      if (createdStripeCouponId) {
        try {
          await stripe.coupons.del(
            createdStripeCouponId
          );
        } catch (couponError) {
          console.error(
            "STRIPE COUPON CLEANUP FAILED:",
            couponError
          );
        }
      }

      createdOrderId = null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create the payment session. Your cart has not been lost.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE STRIPE SESSION ID
    |--------------------------------------------------------------------------
    */

    await prisma.payment.update({
      where: {
        id: order.payment.id,
      },

      data: {
        stripeSessionId:
          stripeSession.id,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | STRIPE URL CHECK
    |--------------------------------------------------------------------------
    */

    if (!stripeSession.url) {
      await prisma.$transaction(
        async (tx) => {
          await tx.payment.updateMany({
            where: {
              orderId:
                order.id,
            },

            data: {
              status:
                "FAILED",
            },
          });

          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              status:
                "CANCELLED",
            },
          });
        }
      );

      /*
      |--------------------------------------------------------------------------
      | REMOVE TEMP STRIPE COUPON
      |--------------------------------------------------------------------------
      */

      if (createdStripeCouponId) {
        try {
          await stripe.coupons.del(
            createdStripeCouponId
          );
        } catch (couponError) {
          console.error(
            "STRIPE COUPON CLEANUP FAILED:",
            couponError
          );
        }
      }

      createdOrderId = null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Stripe did not return a checkout URL.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REDIRECT TO STRIPE
    |--------------------------------------------------------------------------
    */

    return NextResponse.redirect(
      stripeSession.url,
      303
    );
  } catch (error) {
    if (error instanceof DeliverySlotUnavailableError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "That time slot has just become unavailable. Please choose another slot.",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "================================="
    );

    console.error(
      "CHECKOUT ERROR"
    );

    console.error(
      "================================="
    );

    console.error(error);

    /*
    |--------------------------------------------------------------------------
    | GLOBAL CLEANUP
    |--------------------------------------------------------------------------
    */

    if (createdOrderId) {
      try {
        await prisma.$transaction(
          async (tx) => {
            await tx.payment.updateMany({
              where: {
                orderId:
                  createdOrderId!,
              },

              data: {
                status:
                  "FAILED",
              },
            });

            await tx.order.update({
              where: {
                id:
                  createdOrderId!,
              },

              data: {
                status:
                  "CANCELLED",
              },
            });
          }
        );
      } catch (cleanupError) {
        console.error(
          "CHECKOUT CLEANUP ERROR:",
          cleanupError
        );
      }
    }

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

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating your order.",
      },
      {
        status: 500,
      }
    );
  }
}