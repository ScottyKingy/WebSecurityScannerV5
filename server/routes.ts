import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './routes/auth';
import creditsRoutes from './routes/credits';
import scanRoutes from './routes/scan';
import { ensureTablesExist } from './db';
import { db } from './db';
import { users } from '@shared/schema';
import { requireAuth, requireAdmin } from './middleware/auth';
import { eq } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  // Check database connection and tables
  await ensureTablesExist();

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/credits', creditsRoutes);
  app.use('/api/scan', scanRoutes);
  
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
