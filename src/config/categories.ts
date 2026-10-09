export interface Category {
  name: string;
  slug: string;
  description: string;
  emoji: string;
}

export const categories: Category[] = [
  {
    name: "Birthday Cakes",
    slug: "birthday",
    description: "Beautiful cakes for unforgettable birthdays.",
    emoji: "🎂",
  },
  {
    name: "Wedding Cakes",
    slug: "wedding",
    description: "Elegant cakes for your special day.",
    emoji: "💍",
  },
  {
    name: "Cupcakes",
    slug: "cupcakes",
    description: "Perfect cupcakes for parties and celebrations.",
    emoji: "🧁",
  },
  {
    name: "Chocolate Cakes",
    slug: "chocolate",
    description: "Rich and delicious chocolate cakes.",
    emoji: "🍫",
  },
  {
    name: "Cheesecakes",
    slug: "cheesecakes",
    description: "Creamy cheesecakes for every occasion.",
    emoji: "🍰",
  },
  {
    name: "Celebration Cakes",
    slug: "celebration",
    description: "Cakes made for moments worth celebrating.",
    emoji: "🎉",
  },
  {
    name: "Custom Cakes",
    slug: "custom",
    description: "Create a cake that is uniquely yours.",
    emoji: "✨",
  },
  {
    name: "Seasonal",
    slug: "seasonal",
    description: "Special cakes and treats for the season.",
    emoji: "🌸",
  },
];
