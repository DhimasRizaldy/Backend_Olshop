/*
  Warnings:

  - You are about to drop the column `name` on the `Promo` table. All the data in the column will be lost.
  - Added the required column `codePromo` to the `Promo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Promo" DROP COLUMN "name",
ADD COLUMN     "codePromo" TEXT NOT NULL;
