import { prisma } from "@/lib/prisma";
import { ensureProductDiscountColumns } from "@/lib/productSchemaCompat";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureProductDiscountColumns();

  const { id } = await params;

  if (!id) {
    return Response.json({ message: "Missing id" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id, isDeleted: false },
  });

  if (!product) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }

  return Response.json(product);
}
