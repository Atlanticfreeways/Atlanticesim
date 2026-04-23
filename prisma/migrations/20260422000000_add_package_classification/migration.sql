-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('DATA_ONLY', 'VOICE_ONLY', 'TEXT_ONLY', 'DATA_WITH_TEXT', 'DATA_WITH_CALL', 'TEXT_WITH_CALL', 'ALL_INCLUSIVE', 'DATA_WITH_ALL_UNLIMITED');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('LOCAL', 'REGIONAL', 'MULTI_COUNTRY', 'GLOBAL');

-- AlterTable: Provider
ALTER TABLE "providers" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "providers" ADD COLUMN "supportedPackageTypes" "PackageType"[];
ALTER TABLE "providers" ADD COLUMN "preferredRegions" TEXT[];

-- AlterTable: Package
ALTER TABLE "packages" ADD COLUMN "packageType" "PackageType" NOT NULL DEFAULT 'DATA_ONLY';
ALTER TABLE "packages" ADD COLUMN "scopeType" "ScopeType" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "packages" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "packages_packageType_scopeType_idx" ON "packages"("packageType", "scopeType");
