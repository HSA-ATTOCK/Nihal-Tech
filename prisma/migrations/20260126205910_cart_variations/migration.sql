-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "selectedVariations" JSONB NOT NULL DEFAULT '{}';
