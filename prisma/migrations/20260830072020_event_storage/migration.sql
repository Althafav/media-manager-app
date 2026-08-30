/*
  Warnings:

  - You are about to drop the column `storage` on the `MediaLocation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "storage" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "MediaLocation" DROP COLUMN "storage";
