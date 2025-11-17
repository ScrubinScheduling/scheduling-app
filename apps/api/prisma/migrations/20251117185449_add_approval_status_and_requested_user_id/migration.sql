/*
  Warnings:

  - You are about to drop the column `status` on the `ShiftRequest` table. All the data in the column will be lost.
  - Added the required column `requestedUserId` to the `ShiftRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '1 day';

-- AlterTable
ALTER TABLE "ShiftRequest" DROP COLUMN "status",
ADD COLUMN     "approvedByManager" "ApprovalStatus",
ADD COLUMN     "approvedByRequested" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "requestedUserId" INTEGER NOT NULL;
