-- AlterTable
ALTER TABLE "MediaLocation" ADD COLUMN     "otherItemId" TEXT;

-- CreateTable
CREATE TABLE "OtherItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtherItem_eventId_idx" ON "OtherItem"("eventId");

-- CreateIndex
CREATE INDEX "MediaLocation_otherItemId_idx" ON "MediaLocation"("otherItemId");

-- AddForeignKey
ALTER TABLE "OtherItem" ADD CONSTRAINT "OtherItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLocation" ADD CONSTRAINT "MediaLocation_otherItemId_fkey" FOREIGN KEY ("otherItemId") REFERENCES "OtherItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
