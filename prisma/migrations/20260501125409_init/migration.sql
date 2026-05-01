-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RECEIVED', 'PAID', 'FEE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EGP', 'USD', 'TRY');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('OPEN', 'PARTIALLY_SETTLED', 'SETTLED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialMovement" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "MovementType" NOT NULL,
    "currency" "Currency" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "rate" DECIMAL(18,6),
    "notes" TEXT,
    "transactionGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionGroup" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'OPEN',
    "costRate" DECIMAL(18,6),
    "sellRate" DECIMAL(18,6),
    "sourceCurrency" "Currency",
    "targetCurrency" "Currency",
    "expectedSourceAmount" DECIMAL(18,4),
    "expectedTargetAmount" DECIMAL(18,4),
    "actualSourceAmount" DECIMAL(18,4),
    "actualTargetAmount" DECIMAL(18,4),
    "profit" DECIMAL(18,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "usdToEgp" DECIMAL(18,6) NOT NULL,
    "usdToTry" DECIMAL(18,6) NOT NULL,
    "crossRate" DECIMAL(18,6) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "FinancialMovement_date_idx" ON "FinancialMovement"("date");

-- CreateIndex
CREATE INDEX "FinancialMovement_customerId_idx" ON "FinancialMovement"("customerId");

-- CreateIndex
CREATE INDEX "FinancialMovement_transactionGroupId_idx" ON "FinancialMovement"("transactionGroupId");

-- CreateIndex
CREATE INDEX "FinancialMovement_type_idx" ON "FinancialMovement"("type");

-- CreateIndex
CREATE INDEX "FinancialMovement_currency_idx" ON "FinancialMovement"("currency");

-- CreateIndex
CREATE INDEX "TransactionGroup_customerId_idx" ON "TransactionGroup"("customerId");

-- CreateIndex
CREATE INDEX "TransactionGroup_status_idx" ON "TransactionGroup"("status");

-- CreateIndex
CREATE INDEX "TransactionGroup_createdAt_idx" ON "TransactionGroup"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionGroup_updatedAt_idx" ON "TransactionGroup"("updatedAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_date_idx" ON "ExchangeRate"("date");

-- AddForeignKey
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_transactionGroupId_fkey" FOREIGN KEY ("transactionGroupId") REFERENCES "TransactionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionGroup" ADD CONSTRAINT "TransactionGroup_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
