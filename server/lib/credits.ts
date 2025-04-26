import { db } from '../db';
import { creditsBalances, creditsTransactions, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Check if a user is enterprise with unlimited credits
export async function hasUnlimitedCredits(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });
  
  // If user is enterprise tier, they have unlimited credits
  return user?.tier === 'enterprise';
}

// Charge credits from a user's balance
export async function chargeCredits(userId: string, amount: number, type: string, metadata: any = {}): Promise<void> {
  // Check if user has unlimited credits (enterprise tier)
  const hasUnlimited = await hasUnlimitedCredits(userId);
  if (hasUnlimited) {
    // Still record the transaction for tracking, but don't deduct from balance
    await db.insert(creditsTransactions).values({
      userId,
      amount: -amount, // Negative amount for charge
      type,
      metadata: JSON.stringify(metadata)
    });
    return;
  }

  // Get the user's balance
  const balance = await db.query.creditsBalances.findFirst({
    where: eq(creditsBalances.userId, userId)
  });

  if (!balance || balance.currentBalance < amount) {
    throw new Error("Insufficient credits");
  }

  // Update balance
  await db.update(creditsBalances)
    .set({ 
      currentBalance: balance.currentBalance - amount,
      updatedAt: new Date()
    })
    .where(eq(creditsBalances.userId, userId));

  // Record transaction
  await db.insert(creditsTransactions).values({
    userId,
    amount: -amount, // Negative amount for charge
    type,
    metadata: JSON.stringify(metadata)
  });
}

// Add credits to a user's balance
export async function grantCredits(userId: string, amount: number, type: string, metadata: any = {}): Promise<void> {
  // Get the user's balance
  const balance = await db.query.creditsBalances.findFirst({
    where: eq(creditsBalances.userId, userId)
  });

  if (!balance) {
    // Create balance record if it doesn't exist
    await db.insert(creditsBalances).values({
      userId,
      currentBalance: amount,
      monthlyAllotment: 0
    });
  } else {
    // Update existing balance
    await db.update(creditsBalances)
      .set({ 
        currentBalance: balance.currentBalance + amount,
        updatedAt: new Date()
      })
      .where(eq(creditsBalances.userId, userId));
  }

  // Record transaction
  await db.insert(creditsTransactions).values({
    userId,
    amount, // Positive amount for grant
    type,
    metadata: JSON.stringify(metadata)
  });
}

// Refund credits to a user's balance (special case of grantCredits)
export async function refundCredits(userId: string, amount: number, type: string = 'refund', metadata: any = {}): Promise<void> {
  return grantCredits(userId, amount, type, {
    ...metadata,
    refund: true,
    timestamp: new Date().toISOString()
  });
}

// Get a user's credit balance
export async function getCreditBalance(userId: string): Promise<any> {
  return await db.query.creditsBalances.findFirst({
    where: eq(creditsBalances.userId, userId)
  });
}