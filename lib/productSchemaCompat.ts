import { prisma } from "@/lib/prisma";

let ensured = false;
let ensuring: Promise<void> | null = null;

export async function ensureProductDiscountColumns() {
  if (ensured) return;
  if (!ensuring) {
    ensuring = (async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Product"
        ADD COLUMN IF NOT EXISTS "originalPrice" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "isDiscounted" BOOLEAN NOT NULL DEFAULT false
      `);
      ensured = true;
    })().finally(() => {
      ensuring = null;
    });
  }

  await ensuring;
}
