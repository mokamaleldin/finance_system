-- AlterEnum
ALTER TYPE "TransferType" ADD VALUE 'DIRECT_EXCHANGE';

-- AlterTable
ALTER TABLE "TransferTransaction" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "costRate" DECIMAL(18,8) NOT NULL DEFAULT 1,
ADD COLUMN     "rateBaseCurrency" "Currency",
ADD COLUMN     "rateDifference" DECIMAL(18,8) NOT NULL DEFAULT 0,
ADD COLUMN     "rateQuoteCurrency" "Currency",
ALTER COLUMN "usdToEgp" DROP NOT NULL,
ALTER COLUMN "usdToTry" DROP NOT NULL;
