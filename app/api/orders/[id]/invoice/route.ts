import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, invoice: true },
  });
  if (!order) return Response.json({ message: "Not found" }, { status: 404 });
  if (order.userId !== user.id && user.role !== "ADMIN") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  return Response.json(order.invoice || null);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN")
    return Response.json({ message: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { url, number, issuedAt } = body as {
    url?: string;
    number?: string;
    issuedAt?: string;
  };
  if (!url || !number)
    return Response.json(
      { message: "url and number required" },
      { status: 400 },
    );

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return Response.json({ message: "Not found" }, { status: 404 });

  const invoice = await prisma.invoice.upsert({
    where: { orderId: id },
    update: {
      url,
      number,
      issuedAt: issuedAt ? new Date(issuedAt) : undefined,
    },
    create: {
      orderId: id,
      url,
      number,
      issuedAt: issuedAt ? new Date(issuedAt) : undefined,
    },
  });

  return Response.json(invoice, { status: 201 });
}
