-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('FULL_ADMIN', 'OPERATOR', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- The hosted database had the old user migration marked as applied while the table
-- was missing, so keep this migration idempotent for both fresh and existing DBs.
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'VIEWER';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
