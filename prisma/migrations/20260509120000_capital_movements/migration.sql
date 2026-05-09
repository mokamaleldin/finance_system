CREATE TYPE "CapitalMovementType" AS ENUM ('INFLOW', 'OUTFLOW');

CREATE TABLE "CapitalMovement" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "type" "CapitalMovementType" NOT NULL,
  "currencyCode" "Currency" NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "description" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CapitalMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CapitalMovement_date_idx" ON "CapitalMovement"("date");
CREATE INDEX "CapitalMovement_type_idx" ON "CapitalMovement"("type");
CREATE INDEX "CapitalMovement_currencyCode_idx" ON "CapitalMovement"("currencyCode");
