import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

let ensuredCategoryTable = false;
let ensuringCategoryTable: Promise<void> | null = null;
let lastCategorySyncAt = 0;
let syncingLegacyCategories: Promise<void> | null = null;
const CATEGORY_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const CATEGORY_RESPONSE_CACHE_MS = 60 * 1000;
let cachedCategories: {
  expiresAt: number;
  data: Array<{ id: string; name: string }>;
} | null = null;

async function ensureCategoryTable() {
  if (ensuredCategoryTable) return;
  if (ensuringCategoryTable) {
    await ensuringCategoryTable;
    return;
  }

  ensuringCategoryTable = (async () => {
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
    ensuredCategoryTable = true;
  })().finally(() => {
    ensuringCategoryTable = null;
  });

  await ensuringCategoryTable;
}

async function syncLegacyCategories() {
  const now = Date.now();
  if (now - lastCategorySyncAt < CATEGORY_SYNC_INTERVAL_MS) return;
  if (syncingLegacyCategories) {
    await syncingLegacyCategories;
    return;
  }

  syncingLegacyCategories = (async () => {
    const products = await prisma.product.findMany({
      where: { isDeleted: false, category: { not: null } },
      distinct: ["category"],
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
    lastCategorySyncAt = Date.now();
  })().finally(() => {
    syncingLegacyCategories = null;
  });

  await syncingLegacyCategories;
}

export async function GET() {
  const now = Date.now();
  if (cachedCategories && cachedCategories.expiresAt > now) {
    return Response.json(cachedCategories.data);
  }

  await ensureCategoryTable();
  await syncLegacyCategories();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  cachedCategories = {
    data: categories,
    expiresAt: now + CATEGORY_RESPONSE_CACHE_MS,
  };

  return Response.json(categories);
}
