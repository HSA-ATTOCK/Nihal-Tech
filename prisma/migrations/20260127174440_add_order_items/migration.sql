-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "items" JSONB NOT NULL DEFAULT '[]';
