/*
  Warnings:

  - You are about to drop the column `cartId` on the `Transactions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transactions" DROP CONSTRAINT "Transactions_cartId_fkey";

-- AlterTable
ALTER TABLE "Transactions" DROP COLUMN "cartId",
ADD COLUMN     "cartIds" TEXT[];

-- CreateTable
CREATE TABLE "_TransactionCarts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TransactionCarts_AB_unique" ON "_TransactionCarts"("A", "B");

-- CreateIndex
CREATE INDEX "_TransactionCarts_B_index" ON "_TransactionCarts"("B");

-- AddForeignKey
ALTER TABLE "_TransactionCarts" ADD CONSTRAINT "_TransactionCarts_A_fkey" FOREIGN KEY ("A") REFERENCES "Carts"("cartId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TransactionCarts" ADD CONSTRAINT "_TransactionCarts_B_fkey" FOREIGN KEY ("B") REFERENCES "Transactions"("transactionId") ON DELETE CASCADE ON UPDATE CASCADE;
