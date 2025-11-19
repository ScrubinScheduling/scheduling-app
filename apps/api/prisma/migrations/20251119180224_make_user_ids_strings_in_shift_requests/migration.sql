-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '1 day';

-- AlterTable
ALTER TABLE "ShiftRequest" ALTER COLUMN "requestorId" SET DATA TYPE TEXT,
ALTER COLUMN "requestedUserId" SET DATA TYPE TEXT;
