import { db } from '../server/db';
import { users, creditsBalances } from '@shared/schema';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'test@example.com')
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Test123!', salt);

    // Create test users with different roles/tiers
    const [regularUser] = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash,
      role: 'user',
      tier: 'lite',
      isVerified: true
    }).returning();

    const [adminUser] = await db.insert(users).values({
      email: 'admin@example.com',
      passwordHash,
      role: 'admin',
      tier: 'enterprise',
      isVerified: true
    }).returning();

    const [deepTierUser] = await db.insert(users).values({
      email: 'deep@example.com',
      passwordHash,
      role: 'user',
      tier: 'deep',
      isVerified: true
    }).returning();

    // Create credits balances for users
    await db.insert(creditsBalances).values({
      userId: regularUser.id,
      amount: 100
    });

    await db.insert(creditsBalances).values({
      userId: adminUser.id,
      amount: 9999
    });

    await db.insert(creditsBalances).values({
      userId: deepTierUser.id,
      amount: 500
    });

    console.log('Test users created successfully:');
    console.log('Regular User:', regularUser.email, '(Password: Test123!)');
    console.log('Admin User:', adminUser.email, '(Password: Test123!)');
    console.log('Deep Tier User:', deepTierUser.email, '(Password: Test123!)');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
createTestUser();