import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { RawOption } from "@/lib/types";
import { formatDeliveryLabel, getDeliveryOption } from "@/lib/delivery";

type SessionUser = { id?: string; email?: string | null };

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

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const method =
    body?.method === "cod"
      ? "cod"
      : body?.method === "paypal"
        ? "paypal"
        : "card";
  const shipping = {
    name: body?.shipping?.name || session.user.name || "Customer",
    email: body?.shipping?.email || session.user.email || "",
    phone: body?.shipping?.phone || "",
    address: body?.shipping?.address || "",
  };
  const deliveryOption = getDeliveryOption(body?.deliveryOptionCode);

  const userId = (session.user as SessionUser).id || "";
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return Response.json({ message: "Cart is empty" }, { status: 400 });
  }

  type ProductShape = { price: number; variations?: unknown };

  type VariationNormalized = { name: string; options?: RawOption[] };

  const computePriceFor = (
    product: ProductShape,
    selectedVariations: Record<string, string> = {},
  ) => {
    const prices: number[] = [];
    const variations = Array.isArray(product.variations)
      ? (product.variations as VariationNormalized[])
      : [];
    variations.forEach((v) => {
      const opts = Array.isArray(v.options) ? v.options : [];
      const sel = selectedVariations?.[v.name];
      if (!sel) return;
      const found = opts.find((o) =>
        typeof o === "string" ? o === sel : o.value === sel,
      );
      if (
        typeof found !== "string" &&
        found &&
        typeof found.price === "number"
      ) {
        prices.push(found.price);
      }
    });
    if (prices.length === 0) return product.price;
    if (prices.length === 1) return prices[0];
    return prices.reduce((a, b) => a + b, 0);
  };

  type DbCartItem = {
    product: { name: string; price: number; variations?: unknown };
    price?: number;
    quantity: number;
    productId: string;
    selectedVariations?: Record<string, string>;
  };

  const lineItems = (cartItems as DbCartItem[]).map((item) => ({
    name: item.product.name,
    price:
      typeof item.price === "number"
        ? item.price
        : computePriceFor(item.product, item.selectedVariations || {}),
    quantity: item.quantity,
    productId: item.productId,
    selectedVariations: item.selectedVariations || {},
  }));

  // Reduce stock and compute subtotal
  let itemsTotal = 0;
  for (const item of lineItems) {
    itemsTotal += item.price * item.quantity;
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
  const deliveryPrice = deliveryOption.price;
  const total = itemsTotal + deliveryPrice;

  const paymentExpiresAt =
    method === "card" || method === "paypal"
      ? new Date(Date.now() + 5 * 60 * 60 * 1000)
      : null;

  const order = await prisma.order.create({
    data: {
      userId,
      itemsTotal,
      deliveryOptionCode: deliveryOption.code,
      deliveryOptionLabel: formatDeliveryLabel(deliveryOption),
      deliveryPrice,
      total,
      shippingAddress: shipping.address,
      phone: shipping.phone,
      shippingName: shipping.name,
      shippingEmail: shipping.email,
      items: lineItems,
      status:
        method === "card" || method === "paypal"
          ? "payment_pending"
          : "pending",
      ...(paymentExpiresAt ? { paymentExpiresAt } : {}),
    },
  });

  // For card payments add a warning comment about auto-cancellation
  if (method === "card" || method === "paypal") {
    await prisma.orderComment.create({
      data: {
        orderId: order.id,
        authorRole: "ADMIN",
        message:
          "⚠️ Payment pending: Your order has been reserved. Please complete your payment. If payment is not received within 5 hours, this order will be automatically cancelled.",
      },
    });
  }

  // Persist contact info for future checkouts
  if (shipping.phone || shipping.address) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: shipping.phone || undefined,
        address: shipping.address || undefined,
      },
    });
  }

  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.EMAIL_USER || session.user.email;

  const orderLines = lineItems
    .map((item) => {
      const variations = item.selectedVariations
        ? Object.entries(item.selectedVariations)
            .map(([k, v]: [string, string]) => `${k}: ${v}`)
            .join(", ")
        : "";
      const line = `${item.name} x${item.quantity} — £${(item.price * item.quantity).toFixed(2)}`;
      return variations ? `${line} (${variations})` : line;
    })
    .join("\n");

  const isCard = method === "card";
  const isPayPal = method === "paypal";
  const isOnlinePayment = isCard || isPayPal;
  const emailSubject = isCard
    ? "Payment pending – action required"
    : isPayPal
      ? "Payment pending – action required"
      : `Order confirmed (Cash on Delivery)`;
  const customerHtml = buildEmail({
    title: isCard ? "Payment pending" : "Order confirmed",
    greeting: `Hi ${shipping.name || "there"},`,
    intro: isCard
      ? "We have reserved your order. Please complete your card payment to confirm it. <strong style='color:#b91c1c;'>If payment is not received within 5 hours, your order will be automatically cancelled.</strong>"
      : isPayPal
        ? "We have reserved your order. Please complete your PayPal payment to confirm it. <strong style='color:#b91c1c;'>If payment is not received within 5 hours, your order will be automatically cancelled.</strong>"
        : "Thanks for your order. We are preparing it now.",
    lines: [
      `<strong>Payment:</strong> ${isCard ? "Card (pending)" : isPayPal ? "PayPal (pending)" : "Cash on Delivery"}`,
      `<strong>Products subtotal:</strong> £${itemsTotal.toFixed(2)}`,
      `<strong>Delivery:</strong> ${formatDeliveryLabel(deliveryOption)} - £${deliveryPrice.toFixed(2)}`,
      `<strong>Total:</strong> £${total.toFixed(2)}`,
      `<strong>Items:</strong><br/>${orderLines.replace(/\n/g, "<br/>")}`,
      `<strong>Phone:</strong> ${shipping.phone || "-"}`,
      ...(isOnlinePayment
        ? [
            `<strong style='color:#b91c1c;'>⚠️ Order will be cancelled if payment is not completed within 5 hours.</strong>`,
          ]
        : []),
      `<strong>Address:</strong> ${shipping.address || "-"}`,
    ],
    footer: "You can view your orders anytime from your account.",
  });

  const adminHtml = buildEmail({
    title: "New order placed",
    intro: "A customer placed a new order.",
    lines: [
      `<strong>Customer:</strong> ${shipping.name} (${shipping.email})`,
      `<strong>Payment:</strong> ${isCard ? "Card (payment pending)" : isPayPal ? "PayPal (payment pending)" : "Cash on Delivery"}`,
      `<strong>Status:</strong> ${isOnlinePayment ? "⚠️ PAYMENT PENDING — auto-cancels in 5 hours if not paid" : "Pending"}`,
      `<strong>Products subtotal:</strong> £${itemsTotal.toFixed(2)}`,
      `<strong>Delivery:</strong> ${formatDeliveryLabel(deliveryOption)} - £${deliveryPrice.toFixed(2)}`,
      `<strong>Total:</strong> £${total.toFixed(2)}`,
      `<strong>Order ID:</strong> ${order.id}`,
      `<strong>Items:</strong><br/>${orderLines.replace(/\n/g, "<br/>")}`,
    ],
  });

  const sendEmails = async () => {
    const sends = [];
    if (shipping.email) {
      sends.push(
        transporter.sendMail({
          to: shipping.email,
          subject: emailSubject,
          html: customerHtml,
        }),
      );
    }
    if (adminEmail) {
      sends.push(
        transporter.sendMail({
          to: adminEmail,
          subject: `Admin copy: ${emailSubject}`,
          html: adminHtml,
        }),
      );
    }
    await Promise.allSettled(sends);
  };

  // For COD, create order and clear cart without Stripe
  if (method === "cod") {
    await prisma.cartItem.deleteMany({ where: { userId } });
    await sendEmails();
    return Response.json({ message: "Order confirmed for Cash on Delivery." });
  }

  if (method === "paypal") {
    const { accessToken, baseUrl } = await getPayPalAccessToken();
    const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const createOrderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            amount: {
              currency_code: "GBP",
              value: total.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: `${siteUrl}/api/checkout/paypal/complete?orderId=${order.id}`,
          cancel_url: `${siteUrl}/orders?payment=cancelled`,
          user_action: "PAY_NOW",
          brand_name: "Nihal Tech",
          shipping_preference: "NO_SHIPPING",
        },
      }),
      cache: "no-store",
    });

    if (!createOrderRes.ok) {
      const errorText = await createOrderRes.text().catch(() => "");
      throw new Error(`Failed to create PayPal order: ${errorText}`);
    }

    const paypalOrder = (await createOrderRes.json()) as {
      id?: string;
      links?: Array<{ rel?: string; href?: string }>;
    };

    const approveLink = paypalOrder.links?.find(
      (link) => link.rel === "approve",
    )?.href;

    if (!approveLink || !paypalOrder.id) {
      throw new Error("PayPal approval URL missing");
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: paypalOrder.id },
    });

    await prisma.cartItem.deleteMany({ where: { userId } });
    await sendEmails();

    return Response.json({ url: approveLink });
  }

  const sessionStripe = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      ...lineItems.map((item) => ({
        price_data: {
          currency: "gbp",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Delivery - ${formatDeliveryLabel(deliveryOption)}`,
          },
          unit_amount: Math.round(deliveryPrice * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: { orderId: order.id },
    // Expire the Stripe session after exactly 5 hours — Stripe will fire
    // checkout.session.expired which our webhook converts to a cancelled order
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60 * 60,
    success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/orders?payment=success`,
    cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/cart`,
  });

  // Store Stripe session ID on the order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: sessionStripe.id },
  });

  // Clear cart after initiating checkout
  await prisma.cartItem.deleteMany({ where: { userId } });

  await sendEmails();

  return Response.json({ url: sessionStripe.url });
}
