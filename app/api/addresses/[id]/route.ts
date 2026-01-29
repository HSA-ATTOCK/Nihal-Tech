import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const address = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!address) return Response.json({ message: "Not found" }, { status: 404 });
  return Response.json(address);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const existing = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing)
    return Response.json({ message: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const {
    label,
    name,
    phone,
    line1,
    line2,
    city,
    postCode,
    country,
    isDefault,
  } = body as {
    label?: string;
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    postCode?: string;
    country?: string;
    isDefault?: boolean;
  };

  const shouldBeDefault = Boolean(isDefault);

  const updated = await prisma.$transaction(async (tx: typeof prisma) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: existing.id },
      data: {
        label: label ?? existing.label,
        name: name ?? existing.name,
        phone: phone ?? existing.phone,
        line1: line1 ?? existing.line1,
        line2: line2 ?? existing.line2,
        city: city ?? existing.city,
        postCode: postCode ?? existing.postCode,
        country: country ?? existing.country,
        isDefault: shouldBeDefault ? true : existing.isDefault,
      },
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

  const existing = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing)
    return Response.json({ message: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id: existing.id } });

  const hasDefault = await prisma.address.count({
    where: { userId: user.id, isDefault: true },
  });
  if (hasDefault === 0) {
    const fallback = await prisma.address.findFirst({
      where: { userId: user.id },
    });
    if (fallback) {
      await prisma.address.update({
        where: { id: fallback.id },
        data: { isDefault: true },
      });
    }
  }

  return Response.json({ success: true });
}
