import { prisma } from "@/lib/prisma";
import { ensureProductDiscountColumns } from "@/lib/productSchemaCompat";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureProductDiscountColumns();

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      originalPrice: true,
      imageUrl: true,
      imageUrls: true,
      category: true,
      variations: true,
      stock: true,
      buyOneGetOneFree: true,
      isDiscounted: true,
    },
  });
  return Response.json(products);
}
