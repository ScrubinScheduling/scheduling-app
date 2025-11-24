/*
  Warnings:

  - Added the required column `createdById` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledAt` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'FINALIZED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "MeetingResponse" AS ENUM ('PENDING', 'YES', 'NO');

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '1 day';

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "adminId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "MeetingInvite" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "membershipId" INTEGER NOT NULL,
    "response" "MeetingResponse" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingInvite_meetingId_membershipId_key" ON "MeetingInvite"("meetingId", "membershipId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInvite" ADD CONSTRAINT "MeetingInvite_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInvite" ADD CONSTRAINT "MeetingInvite_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "UserWorkspaceMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
