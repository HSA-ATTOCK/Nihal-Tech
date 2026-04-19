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
