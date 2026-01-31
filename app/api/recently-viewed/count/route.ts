import { prisma } from "@/lib/prisma";

export async function GET() {
  const views = await prisma.recentlyViewed.groupBy({
    by: ["productId"],
    _count: {
      productId: true,
    },
  });

  const counts: Record<string, number> = {};
  views.forEach((v) => {
    counts[v.productId] = v._count.productId;
  });

  return Response.json(counts);
}
