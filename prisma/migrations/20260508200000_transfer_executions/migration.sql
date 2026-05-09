CREATE TYPE "TransferExecutionType" AS ENUM ('RECEIVED', 'DELIVERED');

CREATE TABLE "TransferExecution" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" "TransferExecutionType" NOT NULL,
  "currency" "Currency" NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TransferExecution_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TransferExecution" (
  "id",
  "transactionId",
  "date",
  "type",
  "currency",
  "amount",
  "notes",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_received_' || "id",
  "id",
  "date",
  'RECEIVED',
  "receivedCurrency",
  "receivedAmount",
  'دفعة استلام من الحالة القديمة',
  "createdAt",
  "updatedAt"
FROM "TransferTransaction"
WHERE "receivedStatus" = 'RECEIVED';

INSERT INTO "TransferExecution" (
  "id",
  "transactionId",
  "date",
  "type",
  "currency",
  "amount",
  "notes",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_delivered_' || "id",
  "id",
  "date",
  'DELIVERED',
  "deliveredCurrency",
  "deliveredAmount",
  'دفعة تسليم من الحالة القديمة',
  "createdAt",
  "updatedAt"
FROM "TransferTransaction"
WHERE "deliveredStatus" = 'DELIVERED';

CREATE INDEX "TransferExecution_transactionId_idx" ON "TransferExecution"("transactionId");
CREATE INDEX "TransferExecution_date_idx" ON "TransferExecution"("date");
CREATE INDEX "TransferExecution_type_idx" ON "TransferExecution"("type");
CREATE INDEX "TransferExecution_currency_idx" ON "TransferExecution"("currency");

ALTER TABLE "TransferExecution"
ADD CONSTRAINT "TransferExecution_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "TransferTransaction"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
