-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'New Phones',
ADD COLUMN     "variations" JSONB NOT NULL DEFAULT '[]';
