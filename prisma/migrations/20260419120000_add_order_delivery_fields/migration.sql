-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "itemsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "deliveryOptionCode" TEXT NOT NULL DEFAULT 'evri_standard_2_4',
ADD COLUMN "deliveryOptionLabel" TEXT NOT NULL DEFAULT 'Evri standard service (2-4 days)',
ADD COLUMN "deliveryPrice" DOUBLE PRECISION NOT NULL DEFAULT 2.89;

-- Backfill itemsTotal for existing orders when possible
UPDATE "Order"
SET "itemsTotal" = GREATEST("total" - "deliveryPrice", 0)
WHERE "itemsTotal" = 0;
