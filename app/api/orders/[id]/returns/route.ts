import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";
import { withErrorEmail } from "@/lib/errorReporter";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { buildEmail } from "@/lib/mailTemplate";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export const GET = withErrorEmail(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    const user = await requireUser();
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { returns: true },
    });
    if (!order) return Response.json({ message: "Not found" }, { status: 404 });
    if (order.userId !== user.id && user.role !== "ADMIN")
      return Response.json({ message: "Forbidden" }, { status: 403 });

    return Response.json(order.returns);
  },
);

export const POST = withErrorEmail(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const user = await requireUser();
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return Response.json({ message: "Not found" }, { status: 404 });
    if (order.userId !== user.id && user.role !== "ADMIN")
      return Response.json({ message: "Forbidden" }, { status: 403 });

    if (!order.deliveredAt)
      return Response.json(
        { message: "Returns are only available after delivery." },
        { status: 400 },
      );

    const deliveredTime = new Date(order.deliveredAt).getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (Number.isNaN(deliveredTime))
      return Response.json(
        { message: "Invalid delivery timestamp." },
        { status: 400 },
      );

    if (Date.now() - deliveredTime > threeDaysMs)
      return Response.json(
        { message: "Return window (3 days after delivery) has expired." },
        { status: 400 },
      );

    const body = await req.json().catch(() => ({}));
    const { reason, notes } = body as { reason?: string; notes?: string };
    if (!reason)
      return Response.json({ message: "Reason is required" }, { status: 400 });

    const rmaNumber = `RMA-${order.id.slice(0, 6).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const request = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: user.id,
        reason,
        notes,
        rmaNumber,
        status: "pending",
      },
    });

    const customerEmail = order.shippingEmail || user.email;
    const adminEmail = process.env.EMAIL_USER;
    const subject = `Return request submitted (${order.id.slice(0, 8)})`;
    const emailHtml = buildEmail({
      title: "Return request submitted",
      intro: "We received your return request.",
      lines: [
        `<strong>Order:</strong> ${order.id}`,
        `<strong>RMA:</strong> ${rmaNumber}`,
        `<strong>Reason:</strong> ${reason}`,
        notes ? `<strong>Notes:</strong> ${notes}` : "",
      ],
    });
    const adminHtml = buildEmail({
      title: "New return request",
      intro: "A customer submitted a return request.",
      lines: [
        `<strong>Order:</strong> ${order.id}`,
        `<strong>RMA:</strong> ${rmaNumber}`,
        `<strong>Reason:</strong> ${reason}`,
        notes ? `<strong>Notes:</strong> ${notes}` : "",
        `<strong>Customer:</strong> ${customerEmail || user.email}`,
      ],
    });

    const sendMail = async (to?: string | null, html?: string) => {
      if (!to || !html) return;
      try {
        await transporter.sendMail({
          to,
          from: process.env.EMAIL_USER,
          subject,
          html,
        });
      } catch (err) {
        console.error("Return email failed", err);
      }
    };
    await Promise.all([
      sendMail(customerEmail, emailHtml),
      sendMail(adminEmail, adminHtml),
    ]);

    return Response.json(request, { status: 201 });
  },
);

export const PATCH = withErrorEmail(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user || user.role !== "ADMIN")
      return Response.json({ message: "Forbidden" }, { status: 403 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { returns: true, user: true },
    });
    if (!order) return Response.json({ message: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { returnId, status } = body as { returnId?: string; status?: string };
    if (!returnId || !status)
      return Response.json(
        { message: "returnId and status are required" },
        { status: 400 },
      );

    const allowed = ["pending", "accepted", "returned", "declined"];
    if (!allowed.includes(status.toLowerCase()))
      return Response.json({ message: "Invalid status" }, { status: 400 });

    const existingReturn = await prisma.returnRequest.findFirst({
      where: { id: returnId, orderId: order.id },
    });
    if (!existingReturn)
      return Response.json({ message: "Return not found" }, { status: 404 });

    const nextReturn = await prisma.returnRequest.update({
      where: { id: existingReturn.id },
      data: { status: status.toLowerCase() },
    });

    let orderStatus: string | undefined;
    if (status.toLowerCase() === "accepted")
      orderStatus = "Return request accepted";
    else if (status.toLowerCase() === "returned") orderStatus = "Returned";

    if (orderStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus },
      });
    }

    const refreshed = await prisma.order.findUnique({
      where: { id: order.id },
      include: { returns: true },
    });

    return Response.json({
      returnRequest: nextReturn,
      returns: refreshed?.returns || [],
      orderStatus: orderStatus || order.status,
    });
  },
);
