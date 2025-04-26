import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './routes/auth';
import creditsRoutes from './routes/credits';
import scanRoutes from './routes/scan';
import scanStatusRoutes from './routes/scanStatus';
import scannersRoutes from './routes/scanners';
import { adminRouter as adminRoutes } from './routes/admin';
import { ensureTablesExist } from './db';
import { db } from './db';
import { users, creditsBalances } from '@shared/schema';
import { requireAuth, requireAdmin } from './middleware/auth';
import { eq } from 'drizzle-orm';

export async function registerRoutes(app: Express): Promise<Server> {
  // Check database connection and tables
  await ensureTablesExist();

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/credits', creditsRoutes);
  app.use('/api/scan', scanRoutes);
  app.use('/api/scan-status', scanStatusRoutes);
  app.use('/api/scanners', scannersRoutes);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);

  // Add direct /api/user endpoint for compatibility with frontend
  app.get('/api/user', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get user with credits balance
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get credits balance
      const creditsBalance = await db.query.creditsBalances.findFirst({
        where: eq(creditsBalances.userId, userId)
      });

      // Return user data without sensitive information
      return res.status(200).json({
        id: user.id,
        email: user.email,
        role: user.role,
        tier: user.tier,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isVerified: user.isVerified,
        creditsBalance: creditsBalance ? {
          currentBalance: creditsBalance.currentBalance,
          monthlyAllotment: creditsBalance.monthlyAllotment,
          rolloverEnabled: creditsBalance.rolloverEnabled,
          rolloverExpiry: creditsBalance.rolloverExpiry,
          updatedAt: creditsBalance.updatedAt
        } : null
      });
      
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: "Failed to get user data" });
    }
  });

  // Add missing /api/login and /api/logout endpoints for compatibility with frontend
  app.post('/api/login', async (req, res) => {
    try {
      // Forward to /api/auth/login
      const response = await fetch(`http://localhost:5000/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('Login forwarding error:', error);
      return res.status(500).json({ error: "Failed to process login" });
    }
  });
  
  app.post('/api/logout', requireAuth, async (req, res) => {
    try {
      // Forward to /api/auth/logout
      const response = await fetch(`http://localhost:5000/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('Logout forwarding error:', error);
      return res.status(500).json({ error: "Failed to process logout" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
