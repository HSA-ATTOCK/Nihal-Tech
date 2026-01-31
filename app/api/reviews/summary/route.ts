import { prisma } from "@/lib/prisma";

export async function GET() {
  const reviews = await prisma.review.findMany({
    select: {
      productId: true,
      rating: true,
    },
  });

  const summary: Record<string, { average: number; count: number }> = {};

  reviews.forEach((review) => {
    if (!summary[review.productId]) {
      summary[review.productId] = { average: 0, count: 0 };
    }
    summary[review.productId].count += 1;
  });

  Object.keys(summary).forEach((productId) => {
    const productReviews = reviews.filter((r) => r.productId === productId);
    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    summary[productId].average = total / productReviews.length;
  });

  return Response.json(summary);
}
