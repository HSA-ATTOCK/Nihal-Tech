import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

type SessionUser = { id?: string; email?: string | null };

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
  });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const method = body?.method === "cod" ? "cod" : "card";
  const shipping = {
    name: body?.shipping?.name || session.user.name || "Customer",
    email: body?.shipping?.email || session.user.email || "",
    phone: body?.shipping?.phone || "",
    address: body?.shipping?.address || "",
  };

  const userId = (session.user as SessionUser).id || "";
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return Response.json({ message: "Cart is empty" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems = cartItems.map((item: any) => ({
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    productId: item.productId,
    selectedVariations: item.selectedVariations || {},
  }));

  // Reduce stock and compute total
  let total = 0;
  for (const item of lineItems) {
    total += item.price * item.quantity;
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  const order = await prisma.order.create({
    data: {
      userId,
      total,
      shippingAddress: shipping.address,
      phone: shipping.phone,
      shippingName: shipping.name,
      shippingEmail: shipping.email,
      items: lineItems,
      status: "pending",
    },
  });

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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const orderLines = lineItems
    .map((item: any) => {
      const variations = item.selectedVariations
        ? Object.entries(item.selectedVariations)
            .map(([k, v]: [string, any]) => `${k}: ${v}`)
            .join(", ")
        : "";
      const line = `${item.name} x${item.quantity} — £${(item.price * item.quantity).toFixed(2)}`;
      return variations ? `${line} (${variations})` : line;
    })
    .join("\n");
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const emailSubject = `Order confirmed (${method === "cod" ? "Cash on Delivery" : "Card"})`;
  const customerHtml = buildEmail({
    title: "Order confirmed",
    greeting: `Hi ${shipping.name || "there"},`,
    intro: "Thanks for your order. We are preparing it now.",
    lines: [
      `<strong>Payment:</strong> ${
        method === "cod" ? "Cash on Delivery" : "Card"
      }`,
      `<strong>Total:</strong> £${total.toFixed(2)}`,
      `<strong>Items:</strong><br/>${orderLines.replace(/\n/g, "<br/>")}`,
      `<strong>Phone:</strong> ${shipping.phone || "-"}`,
      `<strong>Address:</strong> ${shipping.address || "-"}`,
    ],
    footer: "You can view your orders anytime from your account.",
  });

  const adminHtml = buildEmail({
    title: "New order placed",
    intro: "A customer placed a new order.",
    lines: [
      `<strong>Customer:</strong> ${shipping.name} (${shipping.email})`,
      `<strong>Payment:</strong> ${
        method === "cod" ? "Cash on Delivery" : "Card"
      }`,
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
          from: process.env.EMAIL_USER,
          subject: emailSubject,
          html: customerHtml,
        }),
      );
    }
    if (adminEmail) {
      sends.push(
        transporter.sendMail({
          to: adminEmail,
          from: process.env.EMAIL_USER,
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

  const sessionStripe = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    line_items: lineItems.map((item: any) => ({
      price_data: {
        currency: "gbp",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/cart`,
  });

  // Clear cart after initiating checkout
  await prisma.cartItem.deleteMany({ where: { userId } });

  await sendEmails();

  return Response.json({ url: sessionStripe.url });
}
