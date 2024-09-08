-- AlterTable
ALTER TABLE "Notifications" ADD COLUMN     "transactionId" TEXT;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("transactionId") ON DELETE SET NULL ON UPDATE CASCADE;
