// GENERATOR: AUTH_SYSTEM
// Script to create the first admin user
// HOW TO RUN: tsx src/scripts/createAdmin.ts <email> <password>

import dotenv from 'dotenv';
dotenv.config();

import { createAdminUser } from '../services/admin/adminService';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: tsx src/scripts/createAdmin.ts <email> <password>');
  console.error('');
  console.error('Example: tsx src/scripts/createAdmin.ts admin@constintel.com mySecurePassword123');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: Password must be at least 8 characters long');
  process.exit(1);
}

async function main() {
  try {
    console.log(`Creating admin user with email: ${email}`);
    await createAdminUser(email, password);
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('You can now login at: http://localhost:3001/admin/login');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the password after first login!');
  } catch (error: any) {
    console.error('❌ Failed to create admin user:', error.message);
    if (error.message.includes('already exists')) {
      console.error('');
      console.error('An admin user already exists. To reset password, you can:');
      console.error('1. Use password reset functionality');
      console.error('2. Or manually update the database');
    }
    process.exit(1);
  }
}

main();

