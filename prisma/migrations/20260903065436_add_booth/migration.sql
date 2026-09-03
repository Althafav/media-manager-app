-- AlterTable
ALTER TABLE "MediaLocation" ADD COLUMN     "boothId" TEXT;

-- CreateTable
CREATE TABLE "Booth" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booth_eventId_idx" ON "Booth"("eventId");

-- CreateIndex
CREATE INDEX "MediaLocation_boothId_idx" ON "MediaLocation"("boothId");

-- AddForeignKey
ALTER TABLE "Booth" ADD CONSTRAINT "Booth_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLocation" ADD CONSTRAINT "MediaLocation_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;
