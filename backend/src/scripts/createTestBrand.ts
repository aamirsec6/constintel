// GENERATOR: AUTH_SYSTEM
// Script to create a test brand with a user
// HOW TO RUN: tsx src/scripts/createTestBrand.ts

import dotenv from 'dotenv';
dotenv.config();

import { getPrismaClient } from '../db/prismaClient';
import { hashPassword } from '../services/auth/passwordService';
import { randomBytes } from 'crypto';

const prisma = getPrismaClient();

async function createTestBrand() {
  try {
    console.log('🚀 Creating test brand and user...\n');

    // Check if test brand already exists
    const existingBrand = await prisma.brand.findFirst({
      where: { name: 'Test Brand' },
    });

    if (existingBrand) {
      console.log('⚠️  Test brand already exists!');
      console.log(`   Brand ID: ${existingBrand.id}`);
      console.log(`   Brand Name: ${existingBrand.name}`);
      
      const existingUser = await prisma.user.findFirst({
        where: { brandId: existingBrand.id },
      });

      if (existingUser) {
        console.log(`\n   User Email: ${existingUser.email}`);
        console.log(`   User ID: ${existingUser.id}`);
        console.log(`   Role: ${existingUser.role}`);
        console.log('\n✅ Test brand and user already exist!');
        console.log('\n📝 Login credentials:');
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Password: test123456 (default)`);
        console.log(`\n   Login at: http://localhost:3001/login`);
        await prisma.$disconnect();
        return;
      }
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        domain: 'test-brand.example.com',
        industry: 'E-commerce',
        plan: 'pro',
        status: 'active',
        apiKey: `test_${randomBytes(16).toString('hex')}`,
        settings: {
          timezone: 'UTC',
          currency: 'USD',
        },
      },
    });

    console.log(`✅ Brand created: ${brand.name}`);
    console.log(`   Brand ID: ${brand.id}`);
    console.log(`   API Key: ${brand.apiKey}`);

    // Create user
    const email = 'test@constintel.com';
    const password = 'test123456';
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'brand_owner',
        brandId: brand.id,
        emailVerified: true, // Skip email verification for test user
      },
    });

    console.log(`✅ User created: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);

    console.log('\n✅ Test brand and user created successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n   Login at: http://localhost:3001/login`);
    console.log(`\n   Brand ID for API calls: ${brand.id}`);
    console.log(`   API Key: ${brand.apiKey}`);

  } catch (error: any) {
    console.error('❌ Error creating test brand:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestBrand()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

