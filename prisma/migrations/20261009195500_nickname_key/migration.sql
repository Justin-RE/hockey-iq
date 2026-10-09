-- Case-insensitive nickname uniqueness. Backfills before adding NOT NULL so it is safe on existing rows.

-- DropIndex
DROP INDEX "User_nickname_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "nicknameKey" TEXT;
UPDATE "User" SET "nicknameKey" = lower("nickname");
ALTER TABLE "User" ALTER COLUMN "nicknameKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_nicknameKey_key" ON "User"("nicknameKey");
