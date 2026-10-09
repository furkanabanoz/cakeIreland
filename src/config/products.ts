export interface ProductOption {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  flavours: string[];
  sizes: string[];
  available: boolean;
  description: string;
  preparationTime: number;
  allergens: string[];
  decorations: ProductOption[];
  extras: ProductOption[];
}


export const products: Product[] = [
  {
    id: "1",
    name: "Chocolate Birthday Cake",
    slug: "chocolate-birthday-cake",
    price: 35,
    category: "birthday",
    flavours: ["Chocolate", "Vanilla", "Red Velvet"],
    sizes: ['6"', '8"', '10"'],
    available: true,
    description:
      "A delicious chocolate celebration cake made for birthdays and special moments.",
    preparationTime: 2,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Standard",
        price: 0,
      },
      {
        name: "Premium",
        price: 10,
      },
      {
        name: "Luxury",
        price: 20,
      },
    ],
    extras: [
      {
        name: "Candles",
        price: 3,
      },
      {
        name: "Flowers",
        price: 8,
      },
      {
        name: "Chocolate decoration",
        price: 5,
      },
    ],
  },
  {
    id: "2",
    name: "Vanilla Celebration Cake",
    slug: "vanilla-celebration-cake",
    price: 32,
    category: "celebration",
    flavours: ["Vanilla", "Chocolate"],
    sizes: ['6"', '8"'],
    available: true,
    description:
      "A light and delicious vanilla cake perfect for celebrations.",
    preparationTime: 2,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Standard",
        price: 0,
      },
      {
        name: "Premium",
        price: 10,
      },
    ],
    extras: [
      {
        name: "Candles",
        price: 3,
      },
      {
        name: "Flowers",
        price: 8,
      },
    ],
  },
  {
    id: "3",
    name: "Red Velvet Cake",
    slug: "red-velvet-cake",
    price: 40,
    category: "birthday",
    flavours: ["Red Velvet"],
    sizes: ['6"', '8"', '10"'],
    available: true,
    description:
      "A rich red velvet cake with a smooth and creamy finish.",
    preparationTime: 2,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Standard",
        price: 0,
      },
      {
        name: "Premium",
        price: 10,
      },
    ],
    extras: [
      {
        name: "Candles",
        price: 3,
      },
      {
        name: "Flowers",
        price: 8,
      },
    ],
  },
  {
    id: "4",
    name: "Classic Cheesecake",
    slug: "classic-cheesecake",
    price: 38,
    category: "cheesecakes",
    flavours: ["Cheesecake"],
    sizes: ['8"'],
    available: true,
    description:
      "A creamy classic cheesecake with a delicious biscuit base.",
    preparationTime: 2,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Standard",
        price: 0,
      },
    ],
    extras: [
      {
        name: "Chocolate decoration",
        price: 5,
      },
    ],
  },
  {
    id: "5",
    name: "Chocolate Cupcake Box",
    slug: "chocolate-cupcake-box",
    price: 24,
    category: "cupcakes",
    flavours: ["Chocolate"],
    sizes: ["6 pack", "12 pack"],
    available: true,
    description:
      "A box of delicious chocolate cupcakes, perfect for sharing.",
    preparationTime: 1,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Standard",
        price: 0,
      },
    ],
    extras: [
      {
        name: "Chocolate decoration",
        price: 5,
      },
    ],
  },
  {
    id: "6",
    name: "Vanilla Cupcake Box",
    slug: "vanilla-cupcake-box",
    price: 22,
    category: "cupcakes",
    flavours: ["Vanilla"],
    sizes: ["6 pack", "12 pack"],
    available: true,
    description:
      "Soft vanilla cupcakes with a delicious creamy topping.",
    preparationTime: 1,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Standard",
        price: 0,
      },
    ],
    extras: [
      {
        name: "Candles",
        price: 3,
      },
    ],
  },
  {
    id: "7",
    name: "Luxury Chocolate Cake",
    slug: "luxury-chocolate-cake",
    price: 55,
    category: "chocolate",
    flavours: ["Chocolate"],
    sizes: ['8"', '10"'],
    available: true,
    description:
      "A luxurious chocolate cake designed for impressive celebrations.",
    preparationTime: 3,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Premium",
        price: 10,
      },
      {
        name: "Luxury",
        price: 20,
      },
    ],
    extras: [
      {
        name: "Flowers",
        price: 8,
      },
      {
        name: "Chocolate decoration",
        price: 5,
      },
    ],
  },
  {
    id: "8",
    name: "Custom Celebration Cake",
    slug: "custom-celebration-cake",
    price: 60,
    category: "custom",
    flavours: ["Chocolate", "Vanilla", "Red Velvet"],
    sizes: ['8"', '10"'],
    available: true,
    description:
      "A custom celebration cake that can be personalised for your special occasion.",
    preparationTime: 3,
    allergens: ["Milk", "Eggs", "Wheat"],
    decorations: [
      {
        name: "Standard",
        price: 0,
      },
      {
        name: "Premium",
        price: 10,
      },
      {
        name: "Luxury",
        price: 20,
      },
    ],
    extras: [
      {
        name: "Candles",
        price: 3,
      },
      {
        name: "Flowers",
        price: 8,
      },
      {
        name: "Chocolate decoration",
        price: 5,
      },
    ],
  },
];
