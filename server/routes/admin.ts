import express, { Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { db } from '../db';
import { users, creditsTransactions, roleTypes, tierOrder } from '@shared/schema';
import { eq, desc, and, gte, lte, inArray, like } from 'drizzle-orm';
import { grantCredits, chargeCredits } from '../lib/credits';
import { z } from 'zod';

const router = express.Router();

/**
 * Get all users with pagination and search
 * GET /api/admin/users
 */
router.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;
    
    let query = db.select().from(users);
    
    // Apply search filter if provided
    if (search) {
      query = query.where(like(users.email, `%${search}%`));
    }
    
    // Get total count for pagination
    const totalQuery = db.select({ count: db.count() }).from(users);
    if (search) {
      totalQuery.where(like(users.email, `%${search}%`));
    }
    const [totalResult] = await totalQuery;
    const total = totalResult?.count || 0;
    
    // Get paginated results
    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
    
    res.json({
      users: results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * Update user role and tier
 * PATCH /api/admin/users/:userId
 */
router.patch('/users/:userId', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Validate input with Zod
    const inputSchema = z.object({
      role: z.enum(roleTypes as [string, ...string[]]).optional(),
      tier: z.enum(tierOrder as [string, ...string[]]).optional(),
    });
    
    const validationResult = inputSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: validationResult.error.errors 
      });
    }
    
    const { role, tier } = validationResult.data;
    
    // Ensure at least one field is being updated
    if (!role && !tier) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Get the user to update
    const [existingUser] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Build update object
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (role) updateData.role = role;
    if (tier) updateData.tier = tier;
    
    // Update the user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(userId)))
      .returning();
    
    // TODO: Log to audit trail
    
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

/**
 * Grant or deduct credits
 * POST /api/admin/credits/grant
 */
router.post('/credits/grant', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Validate input
    const grantSchema = z.object({
      userId: z.string(),
      amount: z.number(),
      reason: z.string().min(3).max(200)
    });
    
    const validationResult = grantSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: validationResult.error.errors 
      });
    }
    
    const { userId, amount, reason } = validationResult.data;
    
    // Check if user exists
    const [userExists] = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Process the credit transaction
    if (amount >= 0) {
      // Grant credits
      await grantCredits(userId, amount, 'admin_grant', { reason, adminId: req.user?.id });
    } else {
      // Deduct credits (amount is negative)
      await chargeCredits(userId, Math.abs(amount), 'admin_deduction', { reason, adminId: req.user?.id });
    }
    
    // Return success
    res.json({ 
      success: true, 
      message: `${amount >= 0 ? 'Granted' : 'Deducted'} ${Math.abs(amount)} credits ${amount >= 0 ? 'to' : 'from'} user ${userId}` 
    });
  } catch (error) {
    console.error('Error processing credit grant/deduction:', error);
    res.status(500).json({ message: 'Failed to process credit action' });
  }
});

/**
 * Get all credit transactions with filtering
 * GET /api/admin/transactions
 */
router.get('/transactions', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const userId = req.query.userId as string;
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    const offset = (page - 1) * limit;
    
    // Build the query with filters
    let query = db.select().from(creditsTransactions);
    let conditions = [];
    
    if (userId) {
      conditions.push(eq(creditsTransactions.userId, userId));
    }
    
    if (type) {
      conditions.push(eq(creditsTransactions.type, type));
    }
    
    if (startDate) {
      conditions.push(gte(creditsTransactions.createdAt, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(creditsTransactions.createdAt, new Date(endDate)));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: db.count() })
      .from(creditsTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
      
    const total = totalResult?.count || 0;
    
    // Get paginated results
    const transactions = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(creditsTransactions.createdAt));
    
    res.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

export default router;