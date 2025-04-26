import bcrypt from 'bcrypt';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users, creditsBalances } from '@shared/schema';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create a user with initial credits
export async function createUser(email: string, password: string, role = 'user', tier = 'lite') {
  const passwordHash = await hashPassword(password);
  
  // Create the user
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    role,
    tier
  }).returning();
  
  // Create initial credits balance
  await db.insert(creditsBalances).values({
    userId: newUser.id,
    amount: 100 // Default starting credits
  });
  
  return newUser;
}

// Find user by email
export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email)
  });
}

// Find user by ID
export async function findUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id)
  });
}

// Update user's last login time
export async function updateLastLogin(userId: string) {
  await db.update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, userId));
}
