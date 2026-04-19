import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/cron/purge-deleted-products
// Permanently deletes products that stayed in recycle bin for over 5 days.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const threshold = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  const toDelete = await prisma.product.findMany({
    where: {
      isDeleted: true,
      deletedAt: { lte: threshold },
    },
    select: { id: true },
  });

  if (!toDelete.length) {
    return Response.json({ purged: 0, message: "No products to purge." });
  }

  const ids = toDelete.map((item) => item.id);

  // Clean dependent rows that do not cascade on Product deletion.
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId: { in: ids } } }),
    prisma.wishlistItem.deleteMany({ where: { productId: { in: ids } } }),
    prisma.recentlyViewed.deleteMany({ where: { productId: { in: ids } } }),
    prisma.productAnswer.deleteMany({
      where: { question: { productId: { in: ids } } },
    }),
    prisma.productQuestion.deleteMany({ where: { productId: { in: ids } } }),
    prisma.review.deleteMany({ where: { productId: { in: ids } } }),
    prisma.product.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return Response.json({
    purged: ids.length,
    message: `Purged ${ids.length} product(s) from recycle bin.`,
  });
}
