import express, { Request, Response } from 'express';
import { db } from '../db';
import { users, creditsBalances, creditsTransactions } from '@shared/schema';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { chargeCredits, grantCredits, getCreditBalance, hasUnlimitedCredits } from '../lib/credits';
import { logAdminAction, getAuditLogs } from '../lib/audit';
import { eq, desc } from 'drizzle-orm';

// Create admin router
export const adminRouter = express.Router();

// Apply admin authorization to all routes in this router
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// Get all users
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    // Get all users with their credit balances
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        tier: users.tier,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users);
    
    // For each user, fetch their credit balance
    const usersWithBalance = await Promise.all(
      allUsers.map(async (user) => {
        if (user.tier === 'enterprise') {
          return {
            ...user,
            creditBalance: 'unlimited',
            isEnterprise: true
          };
        }
        
        const balance = await getCreditBalance(user.id);
        return {
          ...user,
          creditBalance: balance.currentBalance,
          isEnterprise: false
        };
      })
    );
    
    // Log the admin action
    await logAdminAction(req.user.id, 'list_users');
    
    res.status(200).json(usersWithBalance);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get a specific user
adminRouter.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log the admin action
    await logAdminAction(req.user.id, 'view_user', { userId: id });
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update a user's role or tier
adminRouter.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, tier } = req.body;
    
    // Validate the update data
    if (!role && !tier) {
      return res.status(400).json({ message: 'No update data provided' });
    }
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]);
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare update data
    const updateData: any = {};
    if (role) updateData.role = role;
    if (tier) updateData.tier = tier;
    
    // Update the user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));
    
    // Log the admin action
    await logAdminAction(req.user.id, 'update_user', { 
      userId: id, 
      updates: updateData 
    });
    
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Get user's credit balance
adminRouter.get('/users/:id/credits', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has unlimited credits (enterprise tier)
    const isEnterprise = user.tier === 'enterprise';
    
    if (isEnterprise) {
      return res.status(200).json({
        userId: id,
        currentBalance: 9999, // Placeholder for unlimited
        isEnterprise: true
      });
    }
    
    // Get credit balance
    const balance = await getCreditBalance(id);
    
    // Log the admin action
    await logAdminAction(req.user.id, 'view_credits', { userId: id });
    
    res.status(200).json({
      ...balance,
      isEnterprise: false
    });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({ message: 'Failed to fetch credit balance' });
  }
});

// Grant credits to a user
adminRouter.post('/users/:id/credits/grant', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    
    // Validate request
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid credit amount' });
    }
    
    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has unlimited credits (enterprise tier)
    if (user.tier === 'enterprise') {
      return res.status(200).json({
        message: 'Credits not granted - user has unlimited credits',
        userId: id,
        tier: user.tier
      });
    }
    
    // Grant credits
    await grantCredits(id, Number(amount), 'admin_grant', { 
      adminId: req.user.id,
      note: note || 'Admin grant'
    });
    
    // Get updated balance
    const balance = await getCreditBalance(id);
    
    // Log the admin action
    await logAdminAction(req.user.id, 'grant_credits', { 
      userId: id, 
      amount: Number(amount),
      note: note || 'Admin grant'
    });
    
    res.status(200).json({
      message: 'Credits granted successfully',
      userId: id,
      amount: Number(amount),
      currentBalance: balance.currentBalance
    });
  } catch (error) {
    console.error('Error granting credits:', error);
    res.status(500).json({ message: 'Failed to grant credits' });
  }
});

// Deduct credits from a user
adminRouter.post('/users/:id/credits/deduct', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    
    // Validate request
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid credit amount' });
    }
    
    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has unlimited credits (enterprise tier)
    if (user.tier === 'enterprise') {
      return res.status(200).json({
        message: 'Credits not deducted - user has unlimited credits',
        userId: id,
        tier: user.tier
      });
    }
    
    // Get current balance
    const balance = await getCreditBalance(id);
    
    // Check if user has enough credits
    if (balance.currentBalance < Number(amount)) {
      return res.status(400).json({
        message: 'Insufficient credits',
        userId: id,
        currentBalance: balance.currentBalance,
        requestedAmount: Number(amount)
      });
    }
    
    // Deduct credits
    await chargeCredits(id, Number(amount), 'admin_deduct', {
      adminId: req.user.id,
      note: note || 'Admin deduction'
    });
    
    // Get updated balance
    const updatedBalance = await getCreditBalance(id);
    
    // Log the admin action
    await logAdminAction(req.user.id, 'deduct_credits', {
      userId: id,
      amount: Number(amount),
      note: note || 'Admin deduction'
    });
    
    res.status(200).json({
      message: 'Credits deducted successfully',
      userId: id,
      amount: Number(amount),
      currentBalance: updatedBalance.currentBalance
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ message: 'Failed to deduct credits' });
  }
});

// Get credit transactions for a user
adminRouter.get('/users/:id/credits/transactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get transactions
    const transactions = await db
      .select()
      .from(creditsTransactions)
      .where(eq(creditsTransactions.userId, id))
      .orderBy(desc(creditsTransactions.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    // Log the admin action
    await logAdminAction(req.user.id, 'view_transactions', { userId: id });
    
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Get audit logs with optional filtering
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;
    
    // Convert query params to the right types
    const params: any = {
      limit: Number(limit),
      offset: Number(offset)
    };
    
    if (userId) params.userId = userId as string;
    if (action) params.action = action as string;
    if (startDate) params.startDate = new Date(startDate as string);
    if (endDate) params.endDate = new Date(endDate as string);
    
    // Get audit logs
    const logs = await getAuditLogs(params);
    
    // Log the admin action
    await logAdminAction(req.user.id, 'view_audit_logs', { filters: params });
    
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

// Get system statistics for admin dashboard
adminRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    // Count total users
    const [{ count: totalUsers }] = await db
      .select({
        count: db.fn.count(users.id)
      })
      .from(users);
    
    // Count users by tier
    const usersByTier = await db
      .select({
        tier: users.tier,
        count: db.fn.count(users.id)
      })
      .from(users)
      .groupBy(users.tier);
    
    // Count users by role
    const usersByRole = await db
      .select({
        role: users.role,
        count: db.fn.count(users.id)
      })
      .from(users)
      .groupBy(users.role);
    
    // Get total credits issued
    const [{ sum: totalCreditsIssued }] = await db
      .select({
        sum: db.fn.sum(creditsTransactions.amount)
      })
      .from(creditsTransactions)
      .where(eq(creditsTransactions.type, 'admin_grant'));
    
    // Log the admin action
    await logAdminAction(req.user.id, 'view_admin_stats');
    
    res.status(200).json({
      totalUsers,
      usersByTier,
      usersByRole,
      totalCreditsIssued: totalCreditsIssued || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
});