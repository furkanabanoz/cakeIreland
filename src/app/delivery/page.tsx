import type { Metadata } from "next";
import { connection } from "next/server";

import { LegalPage } from "@/components/legal-page";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Delivery and Collection",
  description: "Current CakeIreland delivery and collection options.",
  alternates: { canonical: "/delivery" },
};

export default async function DeliveryPage() {
  await connection();

  const zones = await prisma.deliveryZone.findMany({
    where: { active: true },
    orderBy: { fee: "asc" },
    select: {
      name: true,
      description: true,
      fee: true,
    },
  });

  return (
    <LegalPage
      title="Delivery and collection"
      intro="The current options and charges shown at checkout are the ones available for your order."
      sections={[
        {
          title: "Delivery areas",
          paragraphs: [
            zones.length > 0
              ? "These delivery areas are currently configured:"
              : "Delivery areas are not currently available. Please check again later or contact the business.",
          ],
          bullets: zones.map(
            (zone) =>
              `${zone.name}${zone.description ? ` — ${zone.description}` : ""} — €${Number(zone.fee).toFixed(2)}`
          ),
        },
        {
          title: "Dates and time slots",
          paragraphs: [
            "Available dates and time slots are subject to current capacity and are displayed during checkout. A date or time is not reserved until the order has been placed and confirmed.",
          ],
        },
        {
          title: "Collection",
          paragraphs: [
            "Where collection is available, the current collection location and times are shown during checkout. Please bring your order confirmation when collecting.",
          ],
        },
      ]}
    />
  );
}
