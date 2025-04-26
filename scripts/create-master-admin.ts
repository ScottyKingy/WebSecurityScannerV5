import { db } from '../server/db';
import { users, creditsBalances } from '@shared/schema';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

/**
 * Script to create a master admin user with enterprise tier
 */
async function createMasterAdmin() {
  try {
    console.log('Creating master admin user...');
    
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'admin1234';
    const adminRole = 'admin';
    const adminTier = 'enterprise';
    
    // Hash password 
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    
    // Check if master admin already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail));
    
    const existingUser = existingUsers[0];
    
    let adminUser;
    
    if (existingUser) {
      console.log('Master admin user already exists. Updating role, tier, and password...');
      const [updatedUser] = await db
        .update(users)
        .set({
          role: adminRole,
          tier: adminTier,
          passwordHash
        })
        .where(eq(users.email, adminEmail))
        .returning();
      adminUser = updatedUser;
    } else {
      // Create new admin user
      const [newUser] = await db
        .insert(users)
        .values({
          email: adminEmail,
          passwordHash,
          role: adminRole,
          tier: adminTier,
          createdAt: new Date(),
          lastLogin: null
        })
        .returning();
      adminUser = newUser;
      
      // Create credits balance for admin
      await db.insert(creditsBalances).values({
        userId: adminUser.id,
        amount: 9999
      });
    }
    
    console.log('Master admin user created/updated successfully:');
    console.log(`- Email: ${adminEmail}`);
    console.log(`- Password: ${adminPassword}`);
    console.log(`- Role: ${adminRole}`);
    console.log(`- Tier: ${adminTier}`);
    console.log(`- User ID: ${adminUser.id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating master admin user:', error);
    process.exit(1);
  }
}

// Run the script
createMasterAdmin();