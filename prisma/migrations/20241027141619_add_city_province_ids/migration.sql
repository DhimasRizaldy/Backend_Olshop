/*
  Warnings:

  - You are about to drop the column `city` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Address` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "city",
DROP COLUMN "country",
ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "cityName" TEXT,
ADD COLUMN     "provinceId" TEXT,
ADD COLUMN     "provinceName" TEXT;
