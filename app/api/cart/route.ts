import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { RawOption } from "@/lib/types";

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

  type ProductShape = { price: number; variations?: unknown };

  type VariationNormalized = { name: string; options?: RawOption[] };

  const computePriceFor = (
    product: ProductShape,
    selectedVariations: Record<string, string> = {},
  ) => {
    const prices: number[] = [];
    const variations = Array.isArray(product.variations)
      ? (product.variations as VariationNormalized[])
      : [];

    variations.forEach((v) => {
      const opts = Array.isArray(v.options) ? v.options : [];
      const sel = selectedVariations?.[v.name];
      if (!sel) return;
      const found = opts.find((o) =>
        typeof o === "string" ? o === sel : o.value === sel,
      );
      if (
        typeof found !== "string" &&
        found &&
        typeof found.price === "number"
      ) {
        prices.push(found.price);
      }
    });
    if (prices.length === 0) return product.price;
    if (prices.length === 1) return prices[0];
    return prices.reduce((a, b) => a + b, 0);
  };

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + parsedQty },
    });
  } else {
    const computedPrice = computePriceFor(product, selectedVariations);
    await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity: parsedQty,
        selectedVariations,
        price: computedPrice,
      },
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
