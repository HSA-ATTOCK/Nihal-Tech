import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";
import Stripe from "stripe";
import { NextRequest } from "next/server";

// Tell Next.js NOT to parse the body – Stripe needs the raw bytes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

type LineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariations?: Record<string, string>;
};

async function restoreStock(items: LineItem[]) {
  for (const item of items) {
    try {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    } catch {
      // product might have been deleted; ignore
    }
  }
}

async function sendConfirmationEmail(
  order: {
    id: string;
    shippingEmail: string;
    shippingName: string;
    phone: string;
    total: number;
    items: unknown;
  },
  adminEmail: string,
) {
  const lineItems = Array.isArray(order.items)
    ? (order.items as LineItem[])
    : [];
  const orderLines = lineItems
    .map((item) => {
      const vars = item.selectedVariations
        ? Object.entries(item.selectedVariations)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")
        : "";
      const line = `${item.name} x${item.quantity} — £${(item.price * item.quantity).toFixed(2)}`;
      return vars ? `${line} (${vars})` : line;
    })
    .join("\n");

  const customerHtml = buildEmail({
    title: "Order confirmed",
    greeting: `Hi ${order.shippingName || "there"},`,
    intro:
      "Great news! Your payment was successful and your order is now confirmed.",
    lines: [
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Total:</strong> £${order.total.toFixed(2)}`,
      `<strong>Items:</strong><br/>${orderLines.replace(/\n/g, "<br/>")}`,
      `<strong>Phone:</strong> ${order.phone || "-"}`,
    ],
    footer: "You can track your order anytime from your account.",
  });

  const adminHtml = buildEmail({
    title: "Payment received – Order confirmed",
    intro: "A customer's payment was successful. The order is now confirmed.",
    lines: [
      `<strong>Customer:</strong> ${order.shippingName} (${order.shippingEmail})`,
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Total:</strong> £${order.total.toFixed(2)}`,
      `<strong>Items:</strong><br/>${orderLines.replace(/\n/g, "<br/>")}`,
      `<strong>Phone:</strong> ${order.phone || "-"}`,
    ],
  });

  const sends: Promise<unknown>[] = [];
  if (order.shippingEmail) {
    sends.push(
      transporter.sendMail({
        to: order.shippingEmail,
        subject: "Payment confirmed – Your order is now confirmed!",
        html: customerHtml,
      }),
    );
  }
  if (adminEmail) {
    sends.push(
      transporter.sendMail({
        to: adminEmail,
        subject: `Admin: Payment received – Order #${order.id.slice(0, 8)} confirmed`,
        html: adminHtml,
      }),
    );
  }
  await Promise.allSettled(sends);
}

async function sendCancellationEmail(
  order: {
    id: string;
    shippingEmail: string;
    shippingName: string;
    total: number;
  },
  reason: "payment_failed" | "payment_expired",
  adminEmail: string,
) {
  const customerMessage =
    reason === "payment_expired"
      ? "Your order was automatically cancelled because payment was not received within 5 hours."
      : "Your payment was unsuccessful. Your order has been cancelled and no charge was made.";

  const adminMessage =
    reason === "payment_expired"
      ? "An order was automatically cancelled: no payment received within 5 hours."
      : "An order was cancelled due to a failed payment.";

  const customerHtml = buildEmail({
    title: "Order cancelled",
    greeting: `Hi ${order.shippingName || "there"},`,
    intro: customerMessage,
    lines: [
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Total:</strong> £${order.total.toFixed(2)}`,
    ],
    footer: "If you'd like to place a new order, please visit our store.",
  });

  const adminHtml = buildEmail({
    title: "Order cancelled – Payment not received",
    intro: adminMessage,
    lines: [
      `<strong>Customer:</strong> ${order.shippingName} (${order.shippingEmail})`,
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Total:</strong> £${order.total.toFixed(2)}`,
      `<strong>Reason:</strong> ${reason === "payment_expired" ? "Payment window expired (5 hours)" : "Payment failed"}`,
    ],
  });

  const sends: Promise<unknown>[] = [];
  if (order.shippingEmail) {
    sends.push(
      transporter.sendMail({
        to: order.shippingEmail,
        subject: "Order cancelled – Payment not received",
        html: customerHtml,
      }),
    );
  }
  if (adminEmail) {
    sends.push(
      transporter.sendMail({
        to: adminEmail,
        subject: `Admin: Order #${order.id.slice(0, 8)} cancelled – ${reason === "payment_expired" ? "payment window expired" : "payment failed"}`,
        html: adminHtml,
      }),
    );
  }
  await Promise.allSettled(sends);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    if (
      webhookSecret &&
      webhookSecret !== "whsec_REPLACE_WITH_YOUR_WEBHOOK_SIGNING_SECRET"
    ) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Development fallback: parse without verification (only safe in dev)
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  // ── checkout.session.completed ──────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return new Response("No orderId in metadata", { status: 200 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return new Response("Order not found", { status: 200 });
    }

    // Update status to confirmed
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "confirmed", paymentExpiresAt: null },
    });

    // Add success comment
    await prisma.orderComment.create({
      data: {
        orderId,
        authorRole: "ADMIN",
        message: "✅ Payment received successfully. Order has been confirmed.",
      },
    });

    // Send confirmation email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "";
    try {
      await sendConfirmationEmail(
        {
          id: order.id,
          shippingEmail: order.shippingEmail,
          shippingName: order.shippingName,
          phone: order.phone,
          total: order.total,
          items: order.items,
        },
        adminEmail,
      );
    } catch (e) {
      console.error("Failed to send confirmation email:", e);
    }
  }

  // ── checkout.session.expired ─────────────────────────────────────────────────
  if (
    event.type === "checkout.session.expired" ||
    event.type === "payment_intent.payment_failed"
  ) {
    let orderId: string | undefined;

    if (event.type === "checkout.session.expired") {
      orderId = (event.data.object as Stripe.Checkout.Session).metadata
        ?.orderId;
    } else {
      // For payment_intent.payment_failed look up by stripeSessionId isn't direct;
      // try to find via the payment_intent id in session records
      const pi = event.data.object as Stripe.PaymentIntent;
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: pi.id,
      });
      orderId = sessions.data[0]?.metadata?.orderId;
    }

    if (!orderId) {
      return new Response("No orderId found", { status: 200 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === "cancelled") {
      return new Response("OK", { status: 200 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });

    // Restore stock
    const items = Array.isArray(order.items) ? (order.items as LineItem[]) : [];
    await restoreStock(items);

    const reason =
      event.type === "checkout.session.expired"
        ? "payment_expired"
        : "payment_failed";

    await prisma.orderComment.create({
      data: {
        orderId,
        authorRole: "ADMIN",
        message:
          reason === "payment_expired"
            ? "❌ Order automatically cancelled: no payment received within 5 hours."
            : "❌ Order cancelled: payment failed.",
      },
    });

    try {
      const adminEmailCancel =
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "";
      await sendCancellationEmail(
        {
          id: order.id,
          shippingEmail: order.shippingEmail,
          shippingName: order.shippingName,
          total: order.total,
        },
        reason,
        adminEmailCancel,
      );
    } catch (e) {
      console.error("Failed to send cancellation email:", e);
    }
  }

  return new Response("OK", { status: 200 });
}
