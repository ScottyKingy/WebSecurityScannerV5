import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './routes/auth';
import { ensureTablesExist } from './db';
import { db } from './db';
import { creditsTransactions, creditsBalances } from '@shared/schema';
import { requireAuth, requireAdmin, requireTier } from './middleware/auth';
import { eq } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  // Check database connection and tables
  await ensureTablesExist();

  // API Routes
  app.use('/api/auth', authRoutes);
  
  // Credits API routes
  app.get('/api/credits/balance', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const balance = await db.query.creditsBalances.findFirst({
        where: eq(creditsBalances.userId, userId)
      });

      if (!balance) {
        return res.status(404).json({ error: "Credits balance not found" });
      }

      return res.status(200).json(balance);
    } catch (error) {
      console.error('Get credits balance error:', error);
      return res.status(500).json({ error: "Failed to get credits balance" });
    }
  });

  // Credits transaction history (requires deep tier or higher)
  app.get('/api/credits/history', requireAuth, requireTier('deep'), async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const transactions = await db.query.creditsTransactions.findMany({
        where: eq(creditsTransactions.userId, userId),
        orderBy: (transactions, { desc }) => [desc(transactions.createdAt)]
      });

      return res.status(200).json(transactions);
    } catch (error) {
      console.error('Get credits history error:', error);
      return res.status(500).json({ error: "Failed to get credits history" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)]
      });

      // Remove sensitive information
      const sanitizedUsers = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        tier: user.tier,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isVerified: user.isVerified
      }));

      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ error: "Failed to get users" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
