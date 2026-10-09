import Link from "next/link";

interface DesktopNavProps {
  categories: { name: string; slug: string }[];
}

export function DesktopNav({ categories }: DesktopNavProps) {
  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto md:flex lg:gap-8">
      <Link
        href="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Home
      </Link>

      <Link
        href="/shop"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Shop
      </Link>

      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className="whitespace-nowrap text-sm font-medium transition-colors hover:text-primary"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
