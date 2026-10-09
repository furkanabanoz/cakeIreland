ALTER TABLE "Order"
ADD COLUMN "deliverySlotId" TEXT,
ADD COLUMN "collectionSlotId" TEXT;

CREATE INDEX "Order_deliveryDate_deliverySlotId_status_idx"
ON "Order"("deliveryDate", "deliverySlotId", "status");

CREATE INDEX "Order_deliveryDate_collectionSlotId_status_idx"
ON "Order"("deliveryDate", "collectionSlotId", "status");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_deliverySlotId_fkey"
FOREIGN KEY ("deliverySlotId") REFERENCES "DeliverySlot"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_collectionSlotId_fkey"
FOREIGN KEY ("collectionSlotId") REFERENCES "CollectionSlot"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
