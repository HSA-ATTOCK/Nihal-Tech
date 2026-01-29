import { prisma } from "@/lib/prisma";
import type { Order, User, Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { transporter } from "@/lib/mail";
import { buildEmail } from "@/lib/mailTemplate";
import { withErrorEmail } from "@/lib/errorReporter";

const FORBIDDEN = Response.json({ message: "Forbidden" }, { status: 403 });

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return null;
  return user;
}

async function loadOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      comments: { orderBy: { createdAt: "asc" }, include: { user: true } },
      invoice: true,
      returns: true,
    },
  });
}

async function sendStatusEmail(to: string, subject: string, body: string) {
  if (!to) return;
  try {
    await transporter.sendMail({
      to,
      from: process.env.EMAIL_USER,
      subject,
      html: buildEmail({
        title: "Order update",
        intro: subject,
        lines: [body],
      }),
    });
  } catch (error) {
    console.error("Email send failed", error);
  }
}

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorEmail(
  async (_: NextRequest, { params }: Params) => {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const order = await loadOrder(id);
    if (!order) return Response.json({ message: "Not found" }, { status: 404 });
    if (order.userId !== user.id && user.role !== "ADMIN") return FORBIDDEN;

    return Response.json(order);
  },
);

export const PUT = withErrorEmail(
  async (req: NextRequest, { params }: Params) => {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const order = await loadOrder(id);
    if (!order) return Response.json({ message: "Not found" }, { status: 404 });
    if (order.userId !== user.id) return FORBIDDEN;

    const body = await req.json().catch(() => ({}));
    const { name, email, phone, address, cancel } = body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      cancel?: boolean;
    };

    const data: Partial<
      Pick<
        Order,
        | "phone"
        | "shippingAddress"
        | "shippingName"
        | "shippingEmail"
        | "status"
      >
    > = {};
    if (typeof phone === "string") data.phone = phone;
    if (typeof address === "string") data.shippingAddress = address;
    if (typeof name === "string") data.shippingName = name;
    if (typeof email === "string") data.shippingEmail = email;
    if (cancel) data.status = "cancelled";

    if (Object.keys(data).length === 0) {
      return Response.json({ message: "No changes" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data,
      include: {
        user: true,
        comments: { orderBy: { createdAt: "asc" }, include: { user: true } },
      },
    });

    const userUpdate: Partial<
      Pick<User, "phone" | "address" | "name" | "email">
    > = {};
    if (typeof phone === "string") userUpdate.phone = phone;
    if (typeof address === "string") userUpdate.address = address;
    if (typeof name === "string") userUpdate.name = name;
    if (typeof email === "string") userUpdate.email = email;
    if (Object.keys(userUpdate).length) {
      await prisma.user.update({ where: { id: user.id }, data: userUpdate });
    }

    return Response.json(updated);
  },
);

export const PATCH = withErrorEmail(
  async (req: NextRequest, { params }: Params) => {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (user.role !== "ADMIN") return FORBIDDEN;

    const order = await loadOrder(id);
    if (!order) return Response.json({ message: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { status, comment } = body as { status?: string; comment?: string };

    const previousStatus = order.status;

    const updates: Partial<Pick<Order, "status" | "deliveredAt">> = {};
    if (status) {
      updates.status = status;
      const isDelivered = status.toLowerCase() === "delivered";
      if (isDelivered && !order.deliveredAt) {
        updates.deliveredAt = new Date();
      }
    }

    const tx: Prisma.PrismaPromise<unknown>[] = [
      prisma.order.update({
        where: { id: order.id },
        data: updates,
        include: {
          user: true,
          comments: { orderBy: { createdAt: "asc" }, include: { user: true } },
        },
      }),
    ];

    if (comment) {
      tx.push(
        prisma.orderComment.create({
          data: {
            orderId: order.id,
            userId: user.id,
            authorRole: Role.ADMIN,
            message: comment,
          },
        }),
      );
    }

    const [updated] = await prisma.$transaction(tx);

    const full = await loadOrder(order.id);

    if (full?.user?.email && status && status !== previousStatus) {
      await sendStatusEmail(
        full.user.email,
        `Order ${full.id.slice(0, 8)} is now ${status}`,
        `Your order status changed from ${previousStatus} to ${status}.`,
      );
    }

    return Response.json(full || updated);
  },
);
