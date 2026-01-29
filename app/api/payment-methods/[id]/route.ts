import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const existing = await prisma.paymentMethod.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing)
    return Response.json({ message: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { isDefault } = body as { isDefault?: boolean };

  const updated = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.paymentMethod.update({
      where: { id: existing.id },
      data: { isDefault: Boolean(isDefault) },
    });
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const existing = await prisma.paymentMethod.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing)
    return Response.json({ message: "Not found" }, { status: 404 });

  await prisma.paymentMethod.delete({ where: { id: existing.id } });

  const hasDefault = await prisma.paymentMethod.count({
    where: { userId: user.id, isDefault: true },
  });
  if (hasDefault === 0) {
    const newest = await prisma.paymentMethod.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (newest) {
      await prisma.paymentMethod.update({
        where: { id: newest.id },
        data: { isDefault: true },
      });
    }
  }

  return Response.json({ success: true });
}
