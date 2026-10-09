/*
  Warnings:

  - The `deliveryType` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('DELIVERY', 'COLLECTION');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryType",
ADD COLUMN     "deliveryType" "DeliveryType";
