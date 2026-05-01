-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('EGYPT_TO_TURKEY', 'TURKEY_TO_EGYPT');

-- CreateEnum
CREATE TYPE "TransferStepStatus" AS ENUM ('RECEIVED', 'NOT_RECEIVED', 'DELIVERED', 'NOT_DELIVERED');

-- CreateEnum
CREATE TYPE "ReceivedTransferStatus" AS ENUM ('RECEIVED', 'NOT_RECEIVED');

-- CreateEnum
CREATE TYPE "DeliveredTransferStatus" AS ENUM ('DELIVERED', 'NOT_DELIVERED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TransferTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "customerNameSnapshot" TEXT NOT NULL,
    "customerPhoneSnapshot" TEXT,
    "type" "TransferType" NOT NULL,
    "receivedCurrency" "Currency" NOT NULL,
    "receivedAmount" DECIMAL(18,4) NOT NULL,
    "deliveredCurrency" "Currency" NOT NULL,
    "deliveredAmount" DECIMAL(18,4) NOT NULL,
    "usdToEgp" DECIMAL(18,8) NOT NULL,
    "usdToTry" DECIMAL(18,8) NOT NULL,
    "theoreticalRate" DECIMAL(18,8) NOT NULL,
    "customerRate" DECIMAL(18,8) NOT NULL,
    "profitCurrency" "Currency" NOT NULL,
    "profitAmount" DECIMAL(18,4) NOT NULL,
    "receivedStatus" "ReceivedTransferStatus" NOT NULL DEFAULT 'RECEIVED',
    "deliveredStatus" "DeliveredTransferStatus" NOT NULL DEFAULT 'NOT_DELIVERED',
    "status" "TransferStatus" NOT NULL DEFAULT 'OPEN',
    "isDeliveredAmountManual" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferTransaction_date_idx" ON "TransferTransaction"("date");

-- CreateIndex
CREATE INDEX "TransferTransaction_customerId_idx" ON "TransferTransaction"("customerId");

-- CreateIndex
CREATE INDEX "TransferTransaction_type_idx" ON "TransferTransaction"("type");

-- CreateIndex
CREATE INDEX "TransferTransaction_receivedCurrency_idx" ON "TransferTransaction"("receivedCurrency");

-- CreateIndex
CREATE INDEX "TransferTransaction_deliveredCurrency_idx" ON "TransferTransaction"("deliveredCurrency");

-- CreateIndex
CREATE INDEX "TransferTransaction_receivedStatus_idx" ON "TransferTransaction"("receivedStatus");

-- CreateIndex
CREATE INDEX "TransferTransaction_deliveredStatus_idx" ON "TransferTransaction"("deliveredStatus");

-- CreateIndex
CREATE INDEX "TransferTransaction_status_idx" ON "TransferTransaction"("status");

-- AddForeignKey
ALTER TABLE "TransferTransaction" ADD CONSTRAINT "TransferTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
