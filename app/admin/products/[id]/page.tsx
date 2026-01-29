import { prisma } from "@/lib/prisma";
import EditProductClient, { EditableProduct } from "./EditProductClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  const editable: EditableProduct = {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    stock: Number(product.stock),
    category: product.category,
    description: product.description,
    variations: (Array.isArray(product.variations)
      ? product.variations
      : []) as EditableProduct["variations"],
    imageUrls: product.imageUrls,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <EditProductClient product={editable} />
      </div>
    </div>
  );
}
