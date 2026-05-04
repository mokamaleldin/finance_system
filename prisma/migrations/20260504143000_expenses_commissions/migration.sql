-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'HOSPITALITY', 'TRANSPORTATION', 'INTERNET', 'OPERATIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "CommissionBase" AS ENUM ('RECEIVED_AMOUNT', 'PROFIT');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currencyCode" "Currency" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "personName" TEXT,
    "type" "CommissionType" NOT NULL,
    "base" "CommissionBase" NOT NULL,
    "value" DECIMAL(18,8) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currencyCode" "Currency" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_currencyCode_idx" ON "Expense"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_transactionId_key" ON "Commission"("transactionId");

-- CreateIndex
CREATE INDEX "Commission_currencyCode_idx" ON "Commission"("currencyCode");

-- CreateIndex
CREATE INDEX "Commission_type_idx" ON "Commission"("type");

-- CreateIndex
CREATE INDEX "Commission_base_idx" ON "Commission"("base");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "TransferTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
