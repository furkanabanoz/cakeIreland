-- DropIndex
DROP INDEX "Cart_userId_status_key";

-- CreateIndex
CREATE INDEX "Cart_userId_status_idx" ON "Cart"("userId", "status");
