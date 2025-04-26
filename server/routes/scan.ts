import { Router } from 'express';
import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { scans } from '@shared/schema';
import { requireAuth, requireTier } from '../middleware/auth';
import { chargeCredits, refundCredits } from '../lib/credits';
import { queueScanTask, validateUrl, determineScanType } from '../lib/scanQueue';
import { eq, and } from 'drizzle-orm';

// Extend Express Request to include scanData
declare global {
  namespace Express {
    interface Request {
      scanData?: {
        creditsCharged?: number;
      }
    }
  }
}

const router = Router();

// Input validation schema for scan requests
const scanRequestSchema = z.object({
  targetUrl: z.string().url('Invalid URL format'),
  competitors: z.array(z.string().url('Invalid competitor URL')).optional().default([])
});

// Start a new scan
router.post('/start', requireAuth, requireTier('lite'), async (req, res) => {
  try {
    // Validate request body
    const validatedData = scanRequestSchema.parse(req.body);
    const { targetUrl, competitors } = validatedData;
    
    // Check if competitors are allowed based on user tier
    if (competitors.length > 0 && req.user?.tier === 'lite') {
      return res.status(403).json({ 
        error: "Your current tier does not support competitor analysis. Please upgrade to use this feature." 
      });
    }
    
    // If user is not "ultimate" or higher tier, limit to 1 competitor
    if (competitors.length > 1 && 
        !['ultimate', 'enterprise'].includes(req.user?.tier || '')) {
      return res.status(403).json({ 
        error: "Your current tier supports only 1 competitor. Please upgrade to analyze multiple competitors." 
      });
    }
    
    // Validate URL format for all domains
    if (!validateUrl(targetUrl)) {
      return res.status(400).json({ error: "Invalid target URL format" });
    }
    
    for (const competitor of competitors) {
      if (!validateUrl(competitor)) {
        return res.status(400).json({ error: `Invalid competitor URL format: ${competitor}` });
      }
    }
    
    // Calculate total cost (1 for primary URL + 1 for each competitor)
    const totalCost = 1 + competitors.length;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Determine scan type
    const scanType = determineScanType(competitors.length);
    
    try {
      // Charge credits first
      await chargeCredits(userId, totalCost, 'scan', {
        primaryUrl: targetUrl,
        competitors,
        scanType,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      // Store credit charge info in request for refund in case of failure
      req.scanData = { creditsCharged: totalCost };
      
      // Create scan record
      const [scan] = await db.insert(scans).values({
        userId,
        primaryUrl: targetUrl,
        competitors,
        status: 'queued',
        creditsUsed: totalCost,
        scanType,
        source: 'web', // Assuming web interface by default. Could be 'api' or 'scheduled'
      }).returning();
      
      // Queue the scan task
      const allDomains = [targetUrl, ...competitors];
      const taskId = await queueScanTask(scan.id, allDomains);
      
      // Return success response
      return res.status(201).json({
        scanId: scan.id,
        status: scan.status,
        creditsCharged: totalCost,
        taskId
      });
      
    } catch (error: any) {
      // If error message indicates insufficient credits, return 403
      if (error.message === 'Insufficient credits') {
        return res.status(403).json({ error: 'Insufficient credits for this scan' });
      }
      
      // For other errors during the credit charge process, propagate the error
      throw error;
    }
    
  } catch (error: any) {
    console.error('Scan start error:', error);
    
    // If we charged credits but failed to queue the scan, attempt to refund
    if (req.scanData && req.scanData.creditsCharged) {
      try {
        await refundCredits(
          req.user?.id || '', 
          req.scanData.creditsCharged, 
          'scan_failed_refund',
          {
            reason: 'Scan queuing failed',
            originalError: error.message
          }
        );
        console.log(`Refunded ${req.scanData.creditsCharged} credits due to scan failure`);
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    return res.status(500).json({ error: 'Failed to start scan' });
  }
});

// Get scan status
router.get('/:scanId', requireAuth, async (req, res) => {
  try {
    const { scanId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const scan = await db.query.scans.findFirst({
      where: (scans, { eq, and }) => and(
        eq(scans.id, scanId),
        eq(scans.userId, userId)
      )
    });
    
    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }
    
    return res.status(200).json(scan);
    
  } catch (error) {
    console.error('Get scan error:', error);
    return res.status(500).json({ error: "Failed to get scan details" });
  }
});

// Get all user scans
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const userScans = await db.query.scans.findMany({
      where: (scans, { eq }) => eq(scans.userId, userId),
      orderBy: (scans, { desc }) => [desc(scans.createdAt)]
    });
    
    return res.status(200).json(userScans);
    
  } catch (error) {
    console.error('Get user scans error:', error);
    return res.status(500).json({ error: "Failed to get user scans" });
  }
});

export default router;