import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";

const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

type LineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariations?: Record<string, string>;
};

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();

  if (!clientId || !secret) {
    throw new Error("PayPal is not configured");
  }

  const baseUrl =
    mode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text().catch(() => "");
    throw new Error(`Failed to authenticate PayPal: ${errorText}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("PayPal access token missing");
  }

  return { accessToken: tokenJson.access_token, baseUrl };
}

async function restoreStock(items: LineItem[]) {
  for (const item of items) {
    try {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    } catch {
      // ignore missing/deleted products
    }
  }
}

async function sendConfirmationEmail(
  order: {
    id: string;
    shippingEmail: string;
    shippingName: string;
    phone: string;
    itemsTotal: number;
    deliveryOptionLabel: string;
    deliveryPrice: number;
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
      const line = `${item.name} x${item.quantity} — £${(
        item.price * item.quantity
      ).toFixed(2)}`;
      return vars ? `${line} (${vars})` : line;
    })
    .join("\n");

  const customerHtml = buildEmail({
    title: "Order confirmed",
    greeting: `Hi ${order.shippingName || "there"},`,
    intro:
      "Great news! Your PayPal payment was successful and your order is now confirmed.",
    lines: [
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Products subtotal:</strong> £${order.itemsTotal.toFixed(2)}`,
      `<strong>Delivery:</strong> ${order.deliveryOptionLabel} - £${order.deliveryPrice.toFixed(2)}`,
      `<strong>Total:</strong> £${order.total.toFixed(2)}`,
      `<strong>Items:</strong><br/>${orderLines.replace(/\n/g, "<br/>")}`,
      `<strong>Phone:</strong> ${order.phone || "-"}`,
    ],
    footer: "You can track your order anytime from your account.",
  });

  const adminHtml = buildEmail({
    title: "PayPal payment received – Order confirmed",
    intro:
      "A customer's PayPal payment was successful. The order is now confirmed.",
    lines: [
      `<strong>Customer:</strong> ${order.shippingName} (${order.shippingEmail})`,
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Products subtotal:</strong> £${order.itemsTotal.toFixed(2)}`,
      `<strong>Delivery:</strong> ${order.deliveryOptionLabel} - £${order.deliveryPrice.toFixed(2)}`,
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
        subject: `Admin: PayPal payment received – Order #${order.id.slice(0, 8)} confirmed`,
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
    itemsTotal: number;
    deliveryOptionLabel: string;
    deliveryPrice: number;
    total: number;
  },
  adminEmail: string,
) {
  const customerHtml = buildEmail({
    title: "Order cancelled",
    greeting: `Hi ${order.shippingName || "there"},`,
    intro:
      "Your PayPal payment was not completed. Your order has been cancelled and no charge was made.",
    lines: [
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Products subtotal:</strong> £${order.itemsTotal.toFixed(2)}`,
      `<strong>Delivery:</strong> ${order.deliveryOptionLabel} - £${order.deliveryPrice.toFixed(2)}`,
      `<strong>Total:</strong> £${order.total.toFixed(2)}`,
    ],
    footer: "If you'd like to place a new order, please visit our store.",
  });

  const adminHtml = buildEmail({
    title: "Order cancelled – PayPal payment not completed",
    intro: "An order was cancelled because PayPal payment was not completed.",
    lines: [
      `<strong>Customer:</strong> ${order.shippingName} (${order.shippingEmail})`,
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Products subtotal:</strong> £${order.itemsTotal.toFixed(2)}`,
      `<strong>Delivery:</strong> ${order.deliveryOptionLabel} - £${order.deliveryPrice.toFixed(2)}`,
      `<strong>Total:</strong> £${order.total.toFixed(2)}`,
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
        subject: `Admin: Order #${order.id.slice(0, 8)} cancelled – PayPal payment not completed`,
        html: adminHtml,
      }),
    );
  }
  await Promise.allSettled(sends);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");

  if (!orderId || !token) {
    return Response.redirect(`${appUrl}/orders?payment=cancelled`, 302);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return Response.redirect(`${appUrl}/orders?payment=cancelled`, 302);
  }

  if (order.status === "confirmed") {
    return Response.redirect(`${appUrl}/orders?payment=success`, 302);
  }

  if (order.status === "cancelled") {
    return Response.redirect(`${appUrl}/orders?payment=cancelled`, 302);
  }

  if (order.stripeSessionId && order.stripeSessionId !== token) {
    return Response.redirect(`${appUrl}/orders?payment=cancelled`, 302);
  }

  try {
    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const captureRes = await fetch(
      `${baseUrl}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!captureRes.ok) {
      const errorText = await captureRes.text().catch(() => "");
      throw new Error(`PayPal capture failed: ${errorText}`);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "confirmed", paymentExpiresAt: null },
    });

    await prisma.orderComment.create({
      data: {
        orderId,
        authorRole: "ADMIN",
        message:
          "✅ PayPal payment received successfully. Order has been confirmed.",
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "";
    try {
      await sendConfirmationEmail(
        {
          id: order.id,
          shippingEmail: order.shippingEmail,
          shippingName: order.shippingName,
          phone: order.phone,
          itemsTotal: order.itemsTotal,
          deliveryOptionLabel: order.deliveryOptionLabel,
          deliveryPrice: order.deliveryPrice,
          total: order.total,
          items: order.items,
        },
        adminEmail,
      );
    } catch (e) {
      console.error("Failed to send PayPal confirmation email:", e);
    }

    return Response.redirect(`${appUrl}/orders?payment=success`, 302);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "PayPal payment failed";
    console.error("PayPal completion failed:", reason);

    if (order.status !== "cancelled") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "cancelled" },
      });

      const items = Array.isArray(order.items)
        ? (order.items as LineItem[])
        : [];
      await restoreStock(items);

      await prisma.orderComment.create({
        data: {
          orderId: order.id,
          authorRole: "ADMIN",
          message:
            "❌ Order cancelled: PayPal payment failed or was not completed.",
        },
      });

      const adminEmail =
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "";
      try {
        await sendCancellationEmail(
          {
            id: order.id,
            shippingEmail: order.shippingEmail,
            shippingName: order.shippingName,
            itemsTotal: order.itemsTotal,
            deliveryOptionLabel: order.deliveryOptionLabel,
            deliveryPrice: order.deliveryPrice,
            total: order.total,
          },
          adminEmail,
        );
      } catch (e) {
        console.error("Failed to send PayPal cancellation email:", e);
      }
    }

    return Response.redirect(`${appUrl}/orders?payment=failed`, 302);
  }
}
