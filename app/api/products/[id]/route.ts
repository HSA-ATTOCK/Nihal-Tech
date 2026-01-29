import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ message: "Missing id" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }

  return Response.json(product);
}
