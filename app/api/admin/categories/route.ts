import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function ensureCategoryTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key"
    ON "Category" ("name")
  `);
}

async function syncLegacyCategories() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { category: true },
  });

  const names = Array.from(
    new Set(
      products
        .map((product) => product.category?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  );

  if (!names.length) return;

  await prisma.category.createMany({
    data: names.map((name) => ({ name })),
    skipDuplicates: true,
  });
}

export async function GET() {
  await ensureCategoryTable();
  await syncLegacyCategories();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json(categories);
}

export async function POST(req: Request) {
  await ensureCategoryTable();
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();

  if (!name) {
    return Response.json(
      { message: "Category name is required" },
      { status: 400 },
    );
  }

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    return Response.json(
      { message: "Category already exists" },
      { status: 409 },
    );
  }

  const category = await prisma.category.create({ data: { name } });
  return Response.json(category, { status: 201 });
}

export async function DELETE(req: Request) {
  await ensureCategoryTable();
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();

  if (!id) {
    return Response.json(
      { message: "Category id is required" },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return Response.json({ message: "Category not found" }, { status: 404 });
  }

  const updated = await prisma.product.updateMany({
    where: { category: category.name },
    data: { category: null },
  });

  await prisma.category.delete({ where: { id } });

  return Response.json({
    message: "Category deleted",
    id: category.id,
    name: category.name,
    productsCleared: updated.count,
  });
}
