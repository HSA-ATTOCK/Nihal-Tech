import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return Response.json(addresses);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

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

  if (!name || !phone || !line1 || !city || !postCode) {
    return Response.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const hasAny = await prisma.address.count({ where: { userId: user.id } });
  const shouldBeDefault = Boolean(isDefault || !hasAny);

  const created = await prisma.$transaction(async (tx: typeof prisma) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId: user.id,
        label: label || "Primary",
        name,
        phone,
        line1,
        line2,
        city,
        postCode,
        country: country || "UK",
        isDefault: shouldBeDefault,
      },
    });
  });

  return Response.json(created, { status: 201 });
}
