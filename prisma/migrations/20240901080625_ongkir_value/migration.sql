-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "ongkirValue" INTEGER DEFAULT 0,
ALTER COLUMN "discount" DROP NOT NULL;
