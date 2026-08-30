-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('AVAILABLE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'AVAILABLE';
