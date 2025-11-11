-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('END_USER', 'BUSINESS_PARTNER', 'ADMIN', 'SUPPORT_AGENT');

-- CreateEnum
CREATE TYPE "DataUnit" AS ENUM ('MB', 'GB');

-- CreateEnum
CREATE TYPE "StartType" AS ENUM ('IMMEDIATE', 'FIRST_USE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'ACTIVATED', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ESimStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED', 'DEPLETED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'END_USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'USD',
    "notifications" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiBaseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerPackageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "countries" TEXT[],
    "regions" TEXT[],
    "dataAmount" INTEGER NOT NULL,
    "dataUnit" "DataUnit" NOT NULL,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "validityDays" INTEGER NOT NULL,
    "startType" "StartType" NOT NULL DEFAULT 'IMMEDIATE',
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" TEXT[],
    "hasVoice" BOOLEAN NOT NULL DEFAULT false,
    "hasSms" BOOLEAN NOT NULL DEFAULT false,
    "voiceMinutes" INTEGER,
    "smsCount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentAmount" DECIMAL(10,2) NOT NULL,
    "paymentCurrency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esims" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "iccid" TEXT NOT NULL,
    "status" "ESimStatus" NOT NULL DEFAULT 'INACTIVE',
    "qrCode" TEXT,
    "smdpAddress" TEXT,
    "activationCode" TEXT,
    "confirmationCode" TEXT,
    "dataUsed" INTEGER NOT NULL DEFAULT 0,
    "dataTotal" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "packages_providerId_providerPackageId_key" ON "packages"("providerId", "providerPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "esims_orderId_key" ON "esims"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "esims_iccid_key" ON "esims"("iccid");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esims" ADD CONSTRAINT "esims_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esims" ADD CONSTRAINT "esims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esims" ADD CONSTRAINT "esims_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON UPDATE CASCADE;