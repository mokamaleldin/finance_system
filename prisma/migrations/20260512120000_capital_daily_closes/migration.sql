CREATE TABLE "CapitalClose" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "usdRates" JSONB NOT NULL,
  "balances" JSONB NOT NULL,
  "capitalUsd" DECIMAL(18,4) NOT NULL,
  "previousCapitalUsd" DECIMAL(18,4) NOT NULL,
  "externalInflowUsd" DECIMAL(18,4) NOT NULL,
  "externalOutflowUsd" DECIMAL(18,4) NOT NULL,
  "profitUsd" DECIMAL(18,4) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CapitalClose_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CapitalClose_date_key" ON "CapitalClose"("date");
CREATE INDEX "CapitalClose_date_idx" ON "CapitalClose"("date");
