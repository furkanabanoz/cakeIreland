import type { Metadata } from "next";
import { connection } from "next/server";

import { LegalPage } from "@/components/legal-page";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Allergens",
  description: "Product allergen information for CakeIreland cakes.",
  alternates: { canonical: "/allergens" },
};

export default async function AllergensPage() {
  await connection();

  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { name: "asc" },
    select: {
      name: true,
      allergens: true,
    },
  });

  return (
    <LegalPage
      title="Allergen information"
      intro="Please check the allergen information for the specific product before ordering."
      notice="Recipe and kitchen handling details must be confirmed by the bakery. Do not treat this page as a guarantee against cross-contact; contact the business before ordering if an allergy could cause harm."
      sections={[
        {
          title: "Product information",
          paragraphs: [
            products.length > 0
              ? "The following allergens are recorded for currently published products:"
              : "No published product allergen information is currently available.",
          ],
          bullets: products.map((product) =>
            product.allergens.length > 0
              ? `${product.name}: ${product.allergens.join(", ")}`
              : `${product.name}: no allergens are listed in the product record`
          ),
        },
        {
          title: "Before ordering",
          paragraphs: [
            "Ingredients, supplier products and preparation practices can change. Product customizations may also affect ingredients. If you have an allergy or dietary requirement, contact the business before placing an order and wait for confirmation that the product is suitable.",
          ],
        },
      ]}
    />
  );
}
