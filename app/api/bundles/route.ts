import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  const filtered = productId
    ? bundles.filter((b: { items?: unknown }) => {
        const items = Array.isArray(b.items)
          ? (b.items as Array<{ productId?: string }>)
          : [];
        return items.some((i) => i.productId === productId);
      })
    : bundles;

  const productIds = new Set<string>();
  filtered.forEach((b: { items?: unknown }) => {
    const items = Array.isArray(b.items)
      ? (b.items as Array<{ productId?: string }>)
      : [];
    items.forEach((i) => {
      if (i.productId) productIds.add(i.productId);
    });
  });

  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(productIds) } },
  });
  const productMap = new Map(products.map((p: { id: string }) => [p.id, p]));

  const withProducts = filtered.map((b: { items?: unknown }) => {
    const items = Array.isArray(b.items)
      ? (b.items as Array<{ productId?: string; quantity?: number }>)
      : [];
    return {
      ...b,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity ?? 1,
        product: i.productId ? productMap.get(i.productId) || null : null,
      })),
    };
  });

  return Response.json(withProducts);
}
