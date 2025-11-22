-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '1 day';

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "adminId" SET DATA TYPE TEXT;
