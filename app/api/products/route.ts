import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { id: "desc" },
  });
  return Response.json(products);
}
