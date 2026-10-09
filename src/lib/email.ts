import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not configured.");
}

if (!emailFrom) {
  throw new Error("EMAIL_FROM is not configured.");
}

const resend = new Resend(resendApiKey);

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  total: number;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: emailFrom as string,
    to,
    subject,
    html,
  });
}

/*
|--------------------------------------------------------------------------
| ORDER RECEIVED
|--------------------------------------------------------------------------
*/

export async function sendOrderReceivedEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Order received - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Thank you for your order!</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          We have received your order and will process it shortly.
        </p>

        <h2>Order details</h2>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          <strong>Total:</strong>
          €${data.total.toFixed(2)}
        </p>

        <p>
          Thank you for choosing Cake Ireland.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| PAYMENT CONFIRMED
|--------------------------------------------------------------------------
*/

export async function sendPaymentConfirmedEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Payment confirmed - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Payment confirmed</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          Your payment has been successfully received.
        </p>

        <h2>Order details</h2>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          <strong>Total paid:</strong>
          €${data.total.toFixed(2)}
        </p>

        <p>
          Your order is now being processed.
        </p>

        <p>
          Thank you for choosing Cake Ireland.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| ORDER CONFIRMED
|--------------------------------------------------------------------------
*/

export async function sendOrderConfirmedEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Order confirmed - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Order confirmed</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          Your order has been confirmed and is now being prepared.
        </p>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          <strong>Total:</strong>
          €${data.total.toFixed(2)}
        </p>

        <p>
          Thank you for choosing Cake Ireland.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| PREPARING
|--------------------------------------------------------------------------
*/

export async function sendPreparingEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Your order is being prepared - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Your order is being prepared</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          We're now preparing your order.
        </p>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          We'll let you know when it's ready.
        </p>

        <p>
          Cake Ireland
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| READY
|--------------------------------------------------------------------------
*/

export async function sendReadyEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Your order is ready - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Your order is ready!</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          Your order is now ready.
        </p>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          Thank you for choosing Cake Ireland.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| OUT FOR DELIVERY
|--------------------------------------------------------------------------
*/

export async function sendOutForDeliveryEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Your order is out for delivery - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Your order is on its way!</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          Your order is now out for delivery.
        </p>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          Please make sure someone is available to receive the order.
        </p>

        <p>
          Cake Ireland
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| DELIVERED
|--------------------------------------------------------------------------
*/

export async function sendDeliveredEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Order delivered - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Your order has been delivered</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          Your order has been successfully delivered.
        </p>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          We hope you enjoy your cake!
        </p>

        <p>
          Thank you for choosing Cake Ireland.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| CANCELLED
|--------------------------------------------------------------------------
*/

export async function sendCancelledEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Order cancelled - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Order cancelled</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          Unfortunately, your order has been cancelled.
        </p>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          <strong>Order total:</strong>
          €${data.total.toFixed(2)}
        </p>

        <p>
          If you have any questions, please contact Cake Ireland.
        </p>
      </div>
    `,
  });
}

/*
|--------------------------------------------------------------------------
| REFUND
|--------------------------------------------------------------------------
*/

export async function sendRefundEmail(
  data: OrderEmailData
) {
  return sendEmail({
    to: data.customerEmail,

    subject: `Refund processed - ${data.orderNumber}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h1>Refund processed</h1>

        <p>Hi ${escapeHtml(data.customerName)},</p>

        <p>
          Your refund has been processed.
        </p>

        <p>
          <strong>Order:</strong>
          #${escapeHtml(data.orderNumber)}
        </p>

        <p>
          <strong>Refund amount:</strong>
          €${data.total.toFixed(2)}
        </p>

        <p>
          The refund may take some time to appear in your account,
          depending on your bank or payment provider.
        </p>

        <p>
          Cake Ireland
        </p>
      </div>
    `,
  });
}