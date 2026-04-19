import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ message: "Missing id" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    return Response.json({ message: "Product not found" }, { status: 404 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return Response.json({
    message: "Product moved to recycle bin",
    id: updated.id,
    deletedAt: updated.deletedAt,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ message: "Missing id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action !== "restore") {
    return Response.json({ message: "Unsupported action" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || !existing.isDeleted) {
    return Response.json(
      { message: "Product is not in recycle bin" },
      { status: 404 },
    );
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });

  return Response.json({
    message: "Product restored",
    id: updated.id,
  });
}
