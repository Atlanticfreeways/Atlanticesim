import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EncryptionUtil } from '../src/common/utils/encryption.util';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@atlanticesim.com' },
    update: {},
    create: {
      email: 'admin@atlanticesim.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const globalPricing = await prisma.globalPricing.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultMargin: 15.00,
      fixedMarkup: 0.00,
    },
  });

  console.log('Seeded global pricing:', globalPricing);

  const airalo = await prisma.provider.upsert({
    where: { slug: 'airalo' },
    update: { priority: 10, preferredRegions: ['EUROPE', 'ASIA_PACIFIC', 'NORTH_AMERICA'], supportedPackageTypes: ['DATA_ONLY'] },
    create: {
      name: 'Airalo',
      slug: 'airalo',
      apiBaseUrl: 'https://sandbox-partners-api.airalo.com/v2',
      isActive: true,
      priority: 10,
      preferredRegions: ['EUROPE', 'ASIA_PACIFIC', 'NORTH_AMERICA'],
      supportedPackageTypes: ['DATA_ONLY'],
      config: {
        apiKey: EncryptionUtil.encrypt(process.env.AIRALO_API_KEY || 'test-key'),
        sandbox: true,
      },
    },
  });

  const esimGo = await prisma.provider.upsert({
    where: { slug: 'esim-go' },
    update: { priority: 15, preferredRegions: ['EUROPE', 'NORTH_AMERICA', 'ASIA_PACIFIC', 'OCEANIA'], supportedPackageTypes: ['DATA_ONLY', 'ALL_INCLUSIVE', 'DATA_WITH_CALL', 'DATA_WITH_TEXT'] },
    create: {
      name: 'eSIM Go',
      slug: 'esim-go',
      apiBaseUrl: 'https://api.esim-go.com/v2.4',
      isActive: true,
      priority: 15,
      preferredRegions: ['EUROPE', 'NORTH_AMERICA', 'ASIA_PACIFIC', 'OCEANIA'],
      supportedPackageTypes: ['DATA_ONLY', 'ALL_INCLUSIVE', 'DATA_WITH_CALL', 'DATA_WITH_TEXT'],
      config: {
        apiKey: EncryptionUtil.encrypt(process.env.ESIM_GO_API_KEY || 'test-key'),
        sandbox: true,
      },
      defaultMargin: 10.00,
      fixedMarkup: 0.50,
    },
  });

  const holafly = await prisma.provider.upsert({
    where: { slug: 'holafly' },
    update: { priority: 25, preferredRegions: ['EUROPE', 'SOUTH_AMERICA'], supportedPackageTypes: ['DATA_ONLY', 'DATA_WITH_ALL_UNLIMITED'] },
    create: {
      name: 'Holafly Business',
      slug: 'holafly',
      apiBaseUrl: 'https://api.holafly.com/v1',
      isActive: true,
      priority: 25,
      preferredRegions: ['EUROPE', 'SOUTH_AMERICA'],
      supportedPackageTypes: ['DATA_ONLY', 'DATA_WITH_ALL_UNLIMITED'],
      config: {
        apiKey: EncryptionUtil.encrypt(process.env.HOLAFLY_API_KEY || 'test-key'),
        sandbox: true,
      },
    },
  });

  const mayaMobile = await prisma.provider.upsert({
    where: { slug: 'maya-mobile' },
    update: { priority: 30, preferredRegions: ['AFRICA', 'ASIA_PACIFIC'], supportedPackageTypes: ['DATA_ONLY', 'ALL_INCLUSIVE', 'DATA_WITH_CALL'] },
    create: {
      name: 'Maya Mobile',
      slug: 'maya-mobile',
      apiBaseUrl: 'https://api.mayamobile.com/v1',
      isActive: true,
      priority: 30,
      preferredRegions: ['AFRICA', 'ASIA_PACIFIC'],
      supportedPackageTypes: ['DATA_ONLY', 'ALL_INCLUSIVE', 'DATA_WITH_CALL'],
      config: {
        apiKey: EncryptionUtil.encrypt(process.env.MAYA_MOBILE_API_KEY || 'test-key'),
        sandbox: true,
      },
    },
  });

  const esimcard = await prisma.provider.upsert({
    where: { slug: 'esimcard' },
    update: { priority: 40, preferredRegions: ['EUROPE', 'NORTH_AMERICA'], supportedPackageTypes: ['DATA_ONLY', 'ALL_INCLUSIVE'] },
    create: {
      name: 'eSIMCard',
      slug: 'esimcard',
      apiBaseUrl: 'https://api.esimcard.com/v1',
      isActive: true,
      priority: 40,
      preferredRegions: ['EUROPE', 'NORTH_AMERICA'],
      supportedPackageTypes: ['DATA_ONLY', 'ALL_INCLUSIVE'],
      config: {
        apiKey: EncryptionUtil.encrypt(process.env.ESIMCARD_API_KEY || 'test-key'),
        sandbox: true,
      },
    },
  });

  const breeze = await prisma.provider.upsert({
    where: { slug: 'breeze' },
    update: { priority: 50, preferredRegions: ['NORTH_AMERICA', 'EUROPE'], supportedPackageTypes: ['DATA_ONLY', 'DATA_WITH_CALL'] },
    create: {
      name: 'eSIM Go/Breeze',
      slug: 'breeze',
      apiBaseUrl: 'https://api.esimgo.com/v2',
      isActive: true,
      priority: 50,
      preferredRegions: ['NORTH_AMERICA', 'EUROPE'],
      supportedPackageTypes: ['DATA_ONLY', 'DATA_WITH_CALL'],
      config: {
        apiKey: EncryptionUtil.encrypt(process.env.BREEZE_API_KEY || 'test-key'),
        sandbox: true,
      },
    },
  });

  console.log('Seeded providers:', { airalo, esimGo, holafly, mayaMobile, esimcard, breeze });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
