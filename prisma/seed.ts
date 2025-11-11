import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create providers
  const airalo = await prisma.provider.upsert({
    where: { slug: 'airalo' },
    update: {},
    create: {
      name: 'Airalo',
      slug: 'airalo',
      apiBaseUrl: 'https://sandbox-partners-api.airalo.com/v2',
      isActive: true,
      config: {
        apiKey: process.env.AIRALO_API_KEY || 'test-key',
        sandbox: true,
      },
    },
  });

  const mayaMobile = await prisma.provider.upsert({
    where: { slug: 'maya-mobile' },
    update: {},
    create: {
      name: 'Maya Mobile',
      slug: 'maya-mobile',
      apiBaseUrl: 'https://api.mayamobile.com/v1',
      isActive: true,
      config: {
        apiKey: process.env.MAYA_MOBILE_API_KEY || 'test-key',
        sandbox: true,
      },
    },
  });

  const esimcard = await prisma.provider.upsert({
    where: { slug: 'esimcard' },
    update: {},
    create: {
      name: 'eSIMCard',
      slug: 'esimcard',
      apiBaseUrl: 'https://api.esimcard.com/v1',
      isActive: true,
      config: {
        apiKey: process.env.ESIMCARD_API_KEY || 'test-key',
        sandbox: true,
      },
    },
  });

  const breeze = await prisma.provider.upsert({
    where: { slug: 'breeze' },
    update: {},
    create: {
      name: 'eSIM Go/Breeze',
      slug: 'breeze',
      apiBaseUrl: 'https://api.esimgo.com/v2',
      isActive: true,
      config: {
        apiKey: process.env.BREEZE_API_KEY || 'test-key',
        sandbox: true,
      },
    },
  });

  const holafly = await prisma.provider.upsert({
    where: { slug: 'holafly' },
    update: {},
    create: {
      name: 'Holafly Business',
      slug: 'holafly',
      apiBaseUrl: 'https://api.holafly.com/v1',
      isActive: true,
      config: {
        apiKey: process.env.HOLAFLY_API_KEY || 'test-key',
        sandbox: true,
      },
    },
  });

  console.log('Seeded providers:', { airalo, mayaMobile, esimcard, breeze, holafly });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });