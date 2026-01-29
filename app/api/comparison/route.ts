import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

async function loadComparison(userId: string) {
  const record = await prisma.productComparison.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const ids = Array.isArray(record?.productIds)
    ? (record?.productIds as string[])
    : [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });
  return { record, products, ids };
}

export async function GET() {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { record, products, ids } = await loadComparison(user.id);
  return Response.json({ ids, products, recordId: record?.id || null });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId } = body as { productId?: string };
  if (!productId)
    return Response.json({ message: "Missing productId" }, { status: 400 });

  const { record, ids } = await loadComparison(user.id);
  const nextIds = Array.from(new Set([productId, ...ids])).slice(0, 4);

  const updated = record
    ? await prisma.productComparison.update({
        where: { id: record.id },
        data: { productIds: nextIds },
      })
    : await prisma.productComparison.create({
        data: { userId: user.id, productIds: nextIds },
      });

  const products = await prisma.product.findMany({
    where: { id: { in: nextIds } },
  });
  return Response.json({ ids: nextIds, products, recordId: updated.id });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId } = body as { productId?: string };
  if (!productId)
    return Response.json({ message: "Missing productId" }, { status: 400 });

  const { record, ids } = await loadComparison(user.id);
  if (!record) return Response.json({ ids: [], products: [], recordId: null });

  const nextIds = ids.filter((id) => id !== productId);
  await prisma.productComparison.update({
    where: { id: record.id },
    data: { productIds: nextIds },
  });
  const products = await prisma.product.findMany({
    where: { id: { in: nextIds } },
  });
  return Response.json({ ids: nextIds, products, recordId: record.id });
}
