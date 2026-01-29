import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

interface OrderItem {
  productId?: string;
  quantity?: number;
  selectedVariations?: Record<string, string>;
}

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!order) return Response.json({ message: "Not found" }, { status: 404 });
  if (order.userId !== user.id && user.role !== "ADMIN") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const items: OrderItem[] = Array.isArray(order.items)
    ? (order.items as OrderItem[])
    : [];

  await prisma.$transaction(async (tx: typeof prisma) => {
    for (const item of items) {
      if (!item.productId) continue;
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;

      const variations = item.selectedVariations || {};
      const existing = await tx.cartItem.findFirst({
        where: {
          userId: user.id,
          productId: item.productId,
          selectedVariations: { equals: variations },
        },
      });

      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + (item.quantity || 1) },
        });
      } else {
        await tx.cartItem.create({
          data: {
            userId: user.id,
            productId: item.productId,
            quantity: item.quantity || 1,
            selectedVariations: variations,
          },
        });
      }
    }
  });

  return Response.json({ success: true });
}
