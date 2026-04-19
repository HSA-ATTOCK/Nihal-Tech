import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type LineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

/**
 * GET /api/cron/cancel-pending-orders
 *
 * This endpoint cancels orders whose payment window has expired (> 5 hours
 * without a completed payment). It should be called on a schedule – e.g.
 * every 15–30 minutes via Vercel Cron or an external cron service.
 *
 * Protect with CRON_SECRET env var to prevent abuse.
 */
export async function GET(req: NextRequest) {
  // Optional: protect the endpoint with a secret token
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Find all payment_pending orders whose expiry has passed
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "payment_pending",
      paymentExpiresAt: { lt: now },
    },
  });

  if (expiredOrders.length === 0) {
    return Response.json({ cancelled: 0, message: "No expired orders found." });
  }

  let cancelledCount = 0;

  for (const order of expiredOrders) {
    try {
      // Cancel the order
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "cancelled" },
      });

      // Restore stock
      const items = Array.isArray(order.items)
        ? (order.items as LineItem[])
        : [];
      for (const item of items) {
        try {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        } catch {
          // product may have been deleted; ignore
        }
      }

      // Add cancellation comment
      await prisma.orderComment.create({
        data: {
          orderId: order.id,
          authorRole: "ADMIN",
          message:
            "❌ Order automatically cancelled: payment was not completed within 5 hours.",
        },
      });

      // Send cancellation emails (customer + admin)
      const adminEmail =
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "";
      const sends: Promise<unknown>[] = [];

      if (order.shippingEmail) {
        sends.push(
          transporter.sendMail({
            to: order.shippingEmail,
            subject: "Order cancelled – Payment window expired",
            html: buildEmail({
              title: "Order cancelled",
              greeting: `Hi ${order.shippingName || "there"},`,
              intro:
                "Your order has been automatically cancelled because the payment was not completed within 5 hours.",
              lines: [
                `<strong>Order ID:</strong> ${order.id}`,
                `<strong>Products subtotal:</strong> £${order.itemsTotal.toFixed(2)}`,
                `<strong>Delivery:</strong> ${order.deliveryOptionLabel} - £${order.deliveryPrice.toFixed(2)}`,
                `<strong>Total:</strong> £${order.total.toFixed(2)}`,
                `<strong style='color:#b91c1c;'>No charge was made to your card.</strong>`,
              ],
              footer:
                "If you would like to place a new order, please visit our store.",
            }),
          }),
        );
      }

      if (adminEmail) {
        sends.push(
          transporter.sendMail({
            to: adminEmail,
            subject: `Admin: Order #${order.id.slice(0, 8)} auto-cancelled – payment window expired`,
            html: buildEmail({
              title: "Order auto-cancelled",
              intro:
                "An order was automatically cancelled: no payment received within 5 hours.",
              lines: [
                `<strong>Customer:</strong> ${order.shippingName} (${order.shippingEmail})`,
                `<strong>Order ID:</strong> ${order.id}`,
                `<strong>Products subtotal:</strong> £${order.itemsTotal.toFixed(2)}`,
                `<strong>Delivery:</strong> ${order.deliveryOptionLabel} - £${order.deliveryPrice.toFixed(2)}`,
                `<strong>Total:</strong> £${order.total.toFixed(2)}`,
              ],
            }),
          }),
        );
      }

      try {
        await Promise.allSettled(sends);
      } catch (e) {
        console.error(
          `Failed to send cancellation email for order ${order.id}:`,
          e,
        );
      }

      cancelledCount++;
    } catch (e) {
      console.error(`Failed to cancel order ${order.id}:`, e);
    }
  }

  return Response.json({
    cancelled: cancelledCount,
    message: `Cancelled ${cancelledCount} expired order(s).`,
  });
}
