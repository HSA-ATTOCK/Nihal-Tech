import { prisma } from "@/lib/prisma";

export async function GET() {
  const grouped = await prisma.review.groupBy({
    by: ["productId"],
    _count: {
      _all: true,
    },
    _avg: {
      rating: true,
    },
  });

  const summary: Record<string, { average: number; count: number }> = {};

  grouped.forEach((entry) => {
    if (!entry.productId) return;
    summary[entry.productId] = {
      average: entry._avg.rating || 0,
      count: entry._count._all,
    };
  });

  return Response.json(summary);
}
