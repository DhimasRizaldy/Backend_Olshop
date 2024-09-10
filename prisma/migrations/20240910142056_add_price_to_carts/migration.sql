/*
  Warnings:

  - You are about to alter the column `price` on the `Carts` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Carts" ALTER COLUMN "price" SET DATA TYPE BIGINT;
