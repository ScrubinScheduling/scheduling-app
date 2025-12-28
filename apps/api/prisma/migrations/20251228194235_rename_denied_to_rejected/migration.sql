/*
  Warnings:

  - The values [DENIED] on the enum `ApprovalStatus` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `approvedByManager` on table `ShiftRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."ShiftRequest" ALTER COLUMN "approvedByRequested" DROP DEFAULT;
ALTER TABLE "ShiftRequest" ALTER COLUMN "approvedByRequested" TYPE "ApprovalStatus_new" USING ("approvedByRequested"::text::"ApprovalStatus_new");
ALTER TABLE "ShiftRequest" ALTER COLUMN "approvedByManager" TYPE "ApprovalStatus_new" USING ("approvedByManager"::text::"ApprovalStatus_new");
ALTER TYPE "ApprovalStatus" RENAME TO "ApprovalStatus_old";
ALTER TYPE "ApprovalStatus_new" RENAME TO "ApprovalStatus";
DROP TYPE "public"."ApprovalStatus_old";
ALTER TABLE "ShiftRequest" ALTER COLUMN "approvedByRequested" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "ShiftRequest" ALTER COLUMN "approvedByManager" SET NOT NULL,
ALTER COLUMN "approvedByManager" SET DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_lendedShiftId_fkey" FOREIGN KEY ("lendedShiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_requestedShiftId_fkey" FOREIGN KEY ("requestedShiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
