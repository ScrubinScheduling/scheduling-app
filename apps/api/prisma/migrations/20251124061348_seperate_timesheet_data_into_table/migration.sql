/*
  Warnings:

  - You are about to drop the column `clockInTime` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `clockOutTime` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `endBreakTime` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `startBreakTime` on the `Shift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '1 day';

-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "clockInTime",
DROP COLUMN "clockOutTime",
DROP COLUMN "endBreakTime",
DROP COLUMN "startBreakTime";

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" SERIAL NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "clockInTime" TIMESTAMP(3),
    "clockOutTime" TIMESTAMP(3),
    "startBreakTime" TIMESTAMP(3),
    "endBreakTime" TIMESTAMP(3),

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Timesheet_shiftId_key" ON "Timesheet"("shiftId");

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
