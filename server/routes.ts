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
  app.use('/api/scan-status', scanStatusRoutes);
  app.use('/api/scanners', scannersRoutes);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
