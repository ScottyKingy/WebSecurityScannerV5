import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Script to create a test admin user with enterprise tier
 */
async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Hash password (using bcrypt directly like in the auth routes)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    // Check if admin@example.com already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'));
    
    const existingUser = existingUsers[0];
    
    if (existingUser) {
      console.log('Admin user already exists. Updating to admin role and enterprise tier...');
      await db
        .update(users)
        .set({
          role: 'admin',
          tier: 'enterprise',
          passwordHash
        })
        .where(eq(users.email, 'admin@example.com'));
    } else {
      // Create new admin user
      await db
        .insert(users)
        .values({
          email: 'admin@example.com',
          passwordHash,
          role: 'admin',
          tier: 'enterprise',
          createdAt: new Date(),
          lastLogin: null
        });
    }
    
    console.log('Admin user created/updated successfully:');
    console.log('- Email: admin@example.com');
    console.log('- Password: admin123');
    console.log('- Role: admin');
    console.log('- Tier: enterprise');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();