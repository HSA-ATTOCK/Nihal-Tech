import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const items = await prisma.recentlyViewed.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { viewedAt: "desc" },
    take: 12,
  });

  return Response.json(items);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId } = body as { productId?: string };
  if (!productId)
    return Response.json({ message: "Missing productId" }, { status: 400 });

  const productExists = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!productExists)
    return Response.json({ message: "Product not found" }, { status: 404 });

  const item = await prisma.recentlyViewed.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { viewedAt: new Date() },
    create: { userId: user.id, productId },
  });

  return Response.json(item, { status: 201 });
}
