/*
  Warnings:

  - You are about to drop the `Fee` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "discountFee" INTEGER;
ALTER TABLE "Schedule" ADD COLUMN "serialFee" INTEGER;
ALTER TABLE "Schedule" ADD COLUMN "visitFee" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Fee";
PRAGMA foreign_keys=on;
