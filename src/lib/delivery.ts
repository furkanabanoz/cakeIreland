import { prisma } from "@/lib/prisma";

export async function getDeliveryZones() {
  return prisma.deliveryZone.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getDeliveryZoneById(id: string) {
  return prisma.deliveryZone.findFirst({
    where: {
      id,
      active: true,
    },
  });
}

export async function calculateDeliveryFee(zoneId: string) {
  const zone = await getDeliveryZoneById(zoneId);

  if (!zone) {
    throw new Error("Delivery zone is not available.");
  }

  return zone.fee;
}
