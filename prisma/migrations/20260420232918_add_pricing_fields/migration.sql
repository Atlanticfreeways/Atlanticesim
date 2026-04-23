-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "retailPriceOverride" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "defaultMargin" DECIMAL(5,2),
ADD COLUMN     "fixedMarkup" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "global_pricing" (
    "id" TEXT NOT NULL,
    "defaultMargin" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "fixedMarkup" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_pricing_pkey" PRIMARY KEY ("id")
);
