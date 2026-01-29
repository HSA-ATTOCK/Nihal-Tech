import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

type SessionUser = { id?: string; email?: string | null };

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  return session;
}

async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return items;
}

export async function GET() {
  const session = await requireSession();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const userId = (session.user as SessionUser).id || "";
  const items = await getCart(userId);
  return Response.json(items);
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const {
    productId,
    quantity = 1,
    selectedVariations = {},
  } = await req.json().catch(() => ({ productId: "" }));
  if (!productId) {
    return Response.json({ message: "productId is required" }, { status: 400 });
  }

  const parsedQty = Number(quantity);
  if (Number.isNaN(parsedQty) || parsedQty <= 0) {
    return Response.json(
      { message: "quantity must be greater than 0" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return Response.json({ message: "Product not found" }, { status: 404 });
  }

  const userId = (session.user as SessionUser).id || "";

  const existing = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId,
      selectedVariations: { equals: selectedVariations },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + parsedQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId, productId, quantity: parsedQty, selectedVariations },
    });
  }

  const items = await getCart(userId);
  return Response.json(items, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session)
    return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { itemId, all } = await req
    .json()
    .catch(() => ({ itemId: undefined, all: false }));
  const userId = (session.user as SessionUser).id || "";

  if (all) {
    await prisma.cartItem.deleteMany({ where: { userId } });
  } else if (itemId) {
    await prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
  } else {
    return Response.json(
      { message: "itemId or all flag required" },
      { status: 400 },
    );
  }

  const items = await getCart(userId);
  return Response.json(items);
}
