ALTER TABLE "Category"
ADD COLUMN "heroTitle" TEXT,
ADD COLUMN "heroSubtitle" TEXT,
ADD COLUMN "heroImage" TEXT,
ADD COLUMN "ctaText" TEXT,
ADD COLUMN "ctaLink" TEXT,
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Category"
SET "heroImage" = "imageUrl"
WHERE "heroImage" IS NULL AND "imageUrl" IS NOT NULL;

CREATE TABLE "CategoryProduct" (
    "categoryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryProduct_pkey" PRIMARY KEY ("categoryId", "productId")
);

INSERT INTO "CategoryProduct" ("categoryId", "productId", "sortOrder")
SELECT
    "categoryId",
    "id",
    ROW_NUMBER() OVER (PARTITION BY "categoryId" ORDER BY "createdAt", "id") - 1
FROM "Product";

CREATE INDEX "CategoryProduct_categoryId_featured_sortOrder_idx"
ON "CategoryProduct"("categoryId", "featured", "sortOrder");

CREATE INDEX "CategoryProduct_productId_idx"
ON "CategoryProduct"("productId");

ALTER TABLE "CategoryProduct"
ADD CONSTRAINT "CategoryProduct_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryProduct"
ADD CONSTRAINT "CategoryProduct_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
