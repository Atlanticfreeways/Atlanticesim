import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnectivity() {
  console.log('--- Connectivity Test ---');

  // 1. Test PostgreSQL
  const prisma = new PrismaClient();
  try {
    console.log('Testing PostgreSQL connection...');
    await prisma.$connect();
    console.log('✅ PostgreSQL: Connected successfully');
    
    const userCount = await prisma.user.count();
    console.log(`📊 PostgreSQL: Found ${userCount} users`);
  } catch (error) {
    console.error('❌ PostgreSQL: Connection failed');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Test Redis
  try {
    console.log('Testing Redis connection...');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ url: redisUrl });
    
    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();
    console.log('✅ Redis: Connected successfully');
    
    await client.set('test_key', 'test_value');
    const val = await client.get('test_key');
    console.log(`📊 Redis: Set/Get test successful (val=${val})`);
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Redis: Connection failed');
    console.error(error.message);
  }
  
  console.log('--- Test Complete ---');
}

testConnectivity();
