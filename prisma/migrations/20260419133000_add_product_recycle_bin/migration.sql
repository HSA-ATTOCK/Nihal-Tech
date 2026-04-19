-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Index for recycle bin and purge job
CREATE INDEX "Product_isDeleted_deletedAt_idx"
ON "Product"("isDeleted", "deletedAt");
