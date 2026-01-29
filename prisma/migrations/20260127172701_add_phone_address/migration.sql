-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shippingAddress" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT DEFAULT '',
ADD COLUMN     "phone" TEXT DEFAULT '';
