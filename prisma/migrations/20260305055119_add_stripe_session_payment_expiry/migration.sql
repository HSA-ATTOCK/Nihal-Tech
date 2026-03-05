-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "stripeSessionId" TEXT;
