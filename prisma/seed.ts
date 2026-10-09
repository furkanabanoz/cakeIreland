import "dotenv/config";
import { PrismaClient } from "../src/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const categories = [
  {
    name: "Birthday Cakes",
    slug: "birthday",
    description:
      "Beautiful cakes made for birthdays and special celebrations.",
    heroTitle: "Birthday Cakes",
    heroSubtitle:
      "Beautiful cakes made for birthdays and special celebrations.",
    sortOrder: 1,
  },
  {
    name: "Celebration Cakes",
    slug: "celebration",
    description:
      "Delicious cakes for every special occasion.",
    sortOrder: 2,
  },
  {
    name: "Wedding Cakes",
    slug: "wedding",
    description:
      "Elegant wedding cakes made to make your special day unforgettable.",
    heroTitle: "Wedding Cakes",
    heroSubtitle:
      "Elegant wedding cakes made to make your special day unforgettable.",
    sortOrder: 3,
  },
  {
    name: "Cheesecakes",
    slug: "cheesecakes",
    description:
      "Creamy and delicious cheesecakes.",
    sortOrder: 4,
  },
  {
    name: "Cupcakes",
    slug: "cupcakes",
    description:
      "Freshly made cupcakes perfect for sharing.",
    heroTitle: "Cupcakes",
    heroSubtitle: "Freshly made cupcakes perfect for sharing.",
    sortOrder: 5,
  },
  {
    name: "Chocolate Cakes",
    slug: "chocolate",
    description:
      "Rich and delicious chocolate cakes.",
    sortOrder: 6,
  },
  {
    name: "Custom Cakes",
    slug: "custom",
    description:
      "Personalised cakes designed for your special occasion.",
    sortOrder: 7,
  },
];

const products = [
  {
    name: "Chocolate Birthday Cake",
    slug: "chocolate-birthday-cake",
    description:
      "A delicious chocolate celebration cake made for birthdays and special moments.",
    basePrice: 35,
    category: "birthday",
    preparationTime: 2,
    flavours: [
      { name: "Chocolate", price: 0 },
      { name: "Vanilla", price: 0 },
      { name: "Red Velvet", price: 5 },
    ],
    sizes: [
      { name: '6"', price: 0 },
      { name: '8"', price: 8 },
      { name: '10"', price: 15 },
    ],
    decorations: [
      { name: "Standard", price: 0 },
      { name: "Premium", price: 10 },
      { name: "Luxury", price: 20 },
    ],
    extras: [
      { name: "Candles", price: 3 },
      { name: "Flowers", price: 8 },
      { name: "Chocolate decoration", price: 5 },
    ],
  },

  {
    name: "Vanilla Celebration Cake",
    slug: "vanilla-celebration-cake",
    description:
      "A light and delicious vanilla cake perfect for celebrations.",
    basePrice: 32,
    category: "celebration",
    preparationTime: 2,
    flavours: [
      { name: "Vanilla", price: 0 },
      { name: "Chocolate", price: 0 },
    ],
    sizes: [
      { name: '6"', price: 0 },
      { name: '8"', price: 8 },
    ],
    decorations: [
      { name: "Standard", price: 0 },
      { name: "Premium", price: 10 },
    ],
    extras: [
      { name: "Candles", price: 3 },
      { name: "Flowers", price: 8 },
    ],
  },

  {
    name: "Red Velvet Cake",
    slug: "red-velvet-cake",
    description:
      "A rich red velvet cake with a smooth and creamy finish.",
    basePrice: 40,
    category: "birthday",
    preparationTime: 2,
    flavours: [
      { name: "Red Velvet", price: 5 },
    ],
    sizes: [
      { name: '6"', price: 0 },
      { name: '8"', price: 8 },
      { name: '10"', price: 15 },
    ],
    decorations: [
      { name: "Standard", price: 0 },
      { name: "Premium", price: 10 },
    ],
    extras: [
      { name: "Candles", price: 3 },
      { name: "Flowers", price: 8 },
    ],
  },

  {
    name: "Classic Cheesecake",
    slug: "classic-cheesecake",
    description:
      "A creamy classic cheesecake with a delicious biscuit base.",
    basePrice: 38,
    category: "cheesecakes",
    preparationTime: 2,
    flavours: [
      { name: "Cheesecake", price: 0 },
    ],
    sizes: [
      { name: '8"', price: 0 },
    ],
    decorations: [
      { name: "Standard", price: 0 },
    ],
    extras: [
      { name: "Chocolate decoration", price: 5 },
    ],
  },

  {
    name: "Chocolate Cupcake Box",
    slug: "chocolate-cupcake-box",
    description:
      "A box of delicious chocolate cupcakes, perfect for sharing.",
    basePrice: 24,
    category: "cupcakes",
    preparationTime: 1,
    flavours: [
      { name: "Chocolate", price: 0 },
    ],
    sizes: [
      { name: "6 pack", price: 0 },
      { name: "12 pack", price: 8 },
    ],
    decorations: [
      { name: "Standard", price: 0 },
    ],
    extras: [
      { name: "Chocolate decoration", price: 5 },
    ],
  },

  {
    name: "Vanilla Cupcake Box",
    slug: "vanilla-cupcake-box",
    description:
      "Soft vanilla cupcakes with a delicious creamy topping.",
    basePrice: 22,
    category: "cupcakes",
    preparationTime: 1,
    flavours: [
      { name: "Vanilla", price: 0 },
    ],
    sizes: [
      { name: "6 pack", price: 0 },
      { name: "12 pack", price: 8 },
    ],
    decorations: [
      { name: "Standard", price: 0 },
    ],
    extras: [
      { name: "Candles", price: 3 },
    ],
  },

  {
    name: "Luxury Chocolate Cake",
    slug: "luxury-chocolate-cake",
    description:
      "A luxurious chocolate cake designed for impressive celebrations.",
    basePrice: 55,
    category: "chocolate",
    preparationTime: 3,
    flavours: [
      { name: "Chocolate", price: 0 },
    ],
    sizes: [
      { name: '8"', price: 8 },
      { name: '10"', price: 15 },
    ],
    decorations: [
      { name: "Premium", price: 10 },
      { name: "Luxury", price: 20 },
    ],
    extras: [
      { name: "Flowers", price: 8 },
      { name: "Chocolate decoration", price: 5 },
    ],
  },

  {
    name: "Custom Celebration Cake",
    slug: "custom-celebration-cake",
    description:
      "A custom celebration cake that can be personalised for your special occasion.",
    basePrice: 60,
    category: "custom",
    preparationTime: 3,
    flavours: [
      { name: "Chocolate", price: 0 },
      { name: "Vanilla", price: 0 },
      { name: "Red Velvet", price: 5 },
    ],
    sizes: [
      { name: '8"', price: 8 },
      { name: '10"', price: 15 },
    ],
    decorations: [
      { name: "Standard", price: 0 },
      { name: "Premium", price: 10 },
      { name: "Luxury", price: 20 },
    ],
    extras: [
      { name: "Candles", price: 3 },
      { name: "Flowers", price: 8 },
      { name: "Chocolate decoration", price: 5 },
    ],
  },
];

const deliveryZones = [
  {
    name: "Cork City",
    description: "Delivery within Cork City.",
    fee: 5,
  },
  {
    name: "Douglas",
    description:
      "Delivery to Douglas and surrounding areas.",
    fee: 6,
  },
  {
    name: "Ballincollig",
    description:
      "Delivery to Ballincollig and surrounding areas.",
    fee: 7,
  },
  {
    name: "Midleton",
    description:
      "Delivery to Midleton and surrounding areas.",
    fee: 8,
  },
];

const deliverySlots = [
  {
    name: "Morning",
    startTime: "09:00",
    endTime: "11:00",
    capacity: 10,
  },
  {
    name: "Late Morning",
    startTime: "11:00",
    endTime: "13:00",
    capacity: 10,
  },
  {
    name: "Afternoon",
    startTime: "13:00",
    endTime: "15:00",
    capacity: 10,
  },
  {
    name: "Late Afternoon",
    startTime: "15:00",
    endTime: "17:00",
    capacity: 10,
  },
];

async function createOption(
  productId: string,
  name: string,
  type:
    | "SIZE"
    | "FLAVOUR"
    | "DECORATION"
    | "EXTRA",
  values: { name: string; price: number }[],
) {
  return prisma.productOption.create({
    data: {
      productId,
      name,
      type,
      values: {
        create: values.map((value) => ({
          name: value.name,
          price: value.price,
          available: true,
        })),
      },
    },
  });
}

async function seedCategories() {
  console.log("📂 Seeding categories...");

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: {
        slug: categoryData.slug,
      },
      update: {
        name: categoryData.name,
        description: categoryData.description,
        published: true,
        sortOrder: categoryData.sortOrder,
      },
      create: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        heroTitle: categoryData.heroTitle,
        heroSubtitle: categoryData.heroSubtitle,
        published: true,
        sortOrder: categoryData.sortOrder,
      },
    });

    console.log(`✅ Category: ${category.name}`);
  }
}

async function seedProducts() {
  console.log("");
  console.log("🍰 Seeding products...");

  for (const productData of products) {
    const category = await prisma.category.findUnique({
      where: {
        slug: productData.category,
      },
    });

    if (!category) {
      throw new Error(
        `Category not found: ${productData.category}`,
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        slug: productData.slug,
      },
      select: {
        id: true,
        categoryId: true,
      },
    });

    const product = await prisma.product.upsert({
      where: {
        slug: productData.slug,
      },
      update: {
        name: productData.name,
        description: productData.description,
        basePrice: productData.basePrice,
        preparationTime: productData.preparationTime,
        available: true,
        published: true,
        categoryId: category.id,
      },
      create: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        basePrice: productData.basePrice,
        preparationTime: productData.preparationTime,
        available: true,
        published: true,
        categoryId: category.id,
      },
    });

    if (
      existingProduct &&
      existingProduct.categoryId !== category.id
    ) {
      await prisma.categoryProduct.deleteMany({
        where: {
          categoryId: existingProduct.categoryId,
          productId: product.id,
        },
      });
    }

    const lastCategoryProduct =
      await prisma.categoryProduct.findFirst({
        where: {
          categoryId: category.id,
        },
        orderBy: {
          sortOrder: "desc",
        },
        select: {
          sortOrder: true,
        },
      });

    await prisma.categoryProduct.upsert({
      where: {
        categoryId_productId: {
          categoryId: category.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        categoryId: category.id,
        productId: product.id,
        sortOrder: (lastCategoryProduct?.sortOrder ?? -1) + 1,
      },
    });

    await prisma.productOption.deleteMany({
      where: {
        productId: product.id,
      },
    });

    await createOption(
      product.id,
      "Size",
      "SIZE",
      productData.sizes,
    );

    await createOption(
      product.id,
      "Flavour",
      "FLAVOUR",
      productData.flavours,
    );

    await createOption(
      product.id,
      "Decoration",
      "DECORATION",
      productData.decorations,
    );

    await createOption(
      product.id,
      "Extras",
      "EXTRA",
      productData.extras,
    );

    console.log(`✅ ${product.name}`);
  }
}

async function seedDeliveryZones() {
  console.log("");
  console.log("🚚 Seeding delivery zones...");

  for (const zoneData of deliveryZones) {
    const existingZone =
      await prisma.deliveryZone.findFirst({
        where: {
          name: zoneData.name,
        },
      });

    if (existingZone) {
      await prisma.deliveryZone.update({
        where: {
          id: existingZone.id,
        },
        data: {
          description: zoneData.description,
          fee: zoneData.fee,
          active: true,
        },
      });
    } else {
      await prisma.deliveryZone.create({
        data: {
          name: zoneData.name,
          description: zoneData.description,
          fee: zoneData.fee,
          active: true,
        },
      });
    }

    console.log(
      `✅ Delivery zone: ${zoneData.name}`,
    );
  }
}

async function seedDeliverySlots() {
  console.log("");
  console.log("🕐 Seeding delivery slots...");

  for (const slotData of deliverySlots) {
    const existingSlot =
      await prisma.deliverySlot.findFirst({
        where: {
          name: slotData.name,
        },
      });

    if (existingSlot) {
      await prisma.deliverySlot.update({
        where: {
          id: existingSlot.id,
        },
        data: {
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          capacity: slotData.capacity,
          active: true,
        },
      });
    } else {
      await prisma.deliverySlot.create({
        data: {
          name: slotData.name,
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          capacity: slotData.capacity,
          active: true,
        },
      });
    }

    console.log(
      `✅ Delivery slot: ${slotData.startTime} - ${slotData.endTime}`,
    );
  }
}

async function main() {
  console.log("🌱 Starting database seed...");
  console.log("");

  await seedCategories();
  await seedProducts();
  await seedDeliveryZones();
  await seedDeliverySlots();

  console.log("");
  console.log(
    "🎉 Database seed completed successfully!",
  );
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
