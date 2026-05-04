-- AlterEnum
ALTER TYPE "Currency" ADD VALUE 'EUR';

-- AlterEnum
ALTER TYPE "TransferType" ADD VALUE 'TRANSFER';

-- AlterTable
ALTER TABLE "TransferTransaction" ADD COLUMN     "deliverLocation" TEXT,
ADD COLUMN     "receiveLocation" TEXT,
ADD COLUMN     "usdRates" JSONB;
