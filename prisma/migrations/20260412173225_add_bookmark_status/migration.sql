/*
  Warnings:

  - You are about to drop the column `url` on the `Bookmark` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `History` table. All the data in the column will be lost.
  - You are about to drop the `Anime` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,malId]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,malId,episode]` on the table `History` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `malId` to the `Bookmark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `episode` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `malId` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `progressTime` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "url",
ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "malId" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'plan_to_watch';

-- AlterTable
ALTER TABLE "History" DROP COLUMN "url",
ADD COLUMN     "episode" TEXT NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "malId" INTEGER NOT NULL,
ADD COLUMN     "progressTime" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- DropTable
DROP TABLE "Anime";

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_malId_key" ON "Bookmark"("userId", "malId");

-- CreateIndex
CREATE UNIQUE INDEX "History_userId_malId_episode_key" ON "History"("userId", "malId", "episode");
