import { Router } from 'express';
import { db } from '../db';
import { creditsBalances, creditsTransactions } from '@shared/schema';
import { requireAuth, requireAdmin, requireTier } from '../middleware/auth';
import { chargeCredits, grantCredits, refundCredits, getCreditBalance } from '../lib/credits';
import { eq } from 'drizzle-orm';

const router = Router();

// Get user's credit balance
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const balance = await getCreditBalance(userId);

    if (!balance) {
      return res.status(404).json({ error: "Credits balance not found" });
    }

    return res.status(200).json(balance);
  } catch (error) {
    console.error('Get credits balance error:', error);
    return res.status(500).json({ error: "Failed to get credits balance" });
  }
});

// Get user's transaction history (requires deep tier or higher)
router.get('/history', requireAuth, requireTier('deep'), async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const transactions = await db.query.creditsTransactions.findMany({
      where: eq(creditsTransactions.userId, userId),
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
      limit
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Get credits history error:', error);
    return res.status(500).json({ error: "Failed to get credits history" });
  }
});

// Grant credits to a user (admin only)
router.post('/grant', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, type = 'admin_grant', metadata = {} } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid user ID and positive amount are required" });
    }

    // Add audit information to metadata
    const auditMetadata = {
      ...metadata,
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    await grantCredits(userId, amount, type, auditMetadata);
    
    // Get updated balance
    const updatedBalance = await getCreditBalance(userId);
    
    return res.status(200).json({
      success: true,
      message: `Granted ${amount} credits to user`,
      currentBalance: updatedBalance?.currentBalance
    });
  } catch (error) {
    console.error('Grant credits error:', error);
    return res.status(500).json({ error: "Failed to grant credits" });
  }
});

// Charge credits from a user
router.post('/charge', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { amount, type = 'charge', metadata = {} } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid positive amount is required" });
    }

    // Add audit information to metadata
    const auditMetadata = {
      ...metadata,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    await chargeCredits(userId, amount, type, auditMetadata);
    
    // Get updated balance
    const updatedBalance = await getCreditBalance(userId);
    
    return res.status(200).json({
      success: true,
      message: `Charged ${amount} credits`,
      currentBalance: updatedBalance?.currentBalance
    });
  } catch (error: any) {
    if (error.message === "Insufficient credits") {
      return res.status(402).json({ error: "Insufficient credits" });
    }
    console.error('Charge credits error:', error);
    return res.status(500).json({ error: "Failed to charge credits" });
  }
});

// Refund credits to a user (admin only)
router.post('/refund', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, type = 'refund', metadata = {} } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid user ID and positive amount are required" });
    }

    // Add audit information to metadata
    const auditMetadata = {
      ...metadata,
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    await refundCredits(userId, amount, type, auditMetadata);
    
    // Get updated balance
    const updatedBalance = await getCreditBalance(userId);
    
    return res.status(200).json({
      success: true,
      message: `Refunded ${amount} credits to user`,
      currentBalance: updatedBalance?.currentBalance
    });
  } catch (error) {
    console.error('Refund credits error:', error);
    return res.status(500).json({ error: "Failed to refund credits" });
  }
});

export default router;