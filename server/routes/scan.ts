import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { scans } from '@shared/schema';
import { queueScanTask, validateUrl, determineScanType } from '../lib/scanQueue';
import { getEnabledScanners } from '../lib/scannerConfig';
import { chargeCredits, refundCredits } from '../lib/credits';
import { eq } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      scanData?: {
        creditsCharged?: number;
      }
    }
  }
}

const router = express.Router();

/**
 * Start a new scan
 * POST /api/scan/start
 */
router.post('/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const { targetUrl, competitors = [] } = req.body;
    
    // Validate all URLs
    if (!validateUrl(targetUrl)) {
      return res.status(400).json({ error: 'Invalid target URL format' });
    }
    
    for (const url of competitors) {
      if (!validateUrl(url)) {
        return res.status(400).json({ error: `Invalid competitor URL format: ${url}` });
      }
    }
    
    // Calculate credit cost (1 credit per domain)
    const allDomains = [targetUrl, ...competitors];
    const creditCost = allDomains.length;
    
    // Charge credits first
    try {
      await chargeCredits(req.user.id, creditCost, 'scan', { 
        primaryUrl: targetUrl,
        competitorCount: competitors.length
      });
    } catch (error) {
      return res.status(403).json({ 
        error: 'Insufficient credits',
        creditsRequired: creditCost,
        message: error.message
      });
    }
    
    // Create scan record
    const [scan] = await db.insert(scans)
      .values({
        userId: req.user.id,
        primaryUrl: targetUrl,
        competitors,
        status: 'queued',
        scanType: determineScanType(competitors.length),
        creditsUsed: creditCost,
        source: 'web',
        scannerKeys: getEnabledScanners(),
      })
      .returning();
    
    // Queue the scan task
    try {
      const taskId = await queueScanTask(scan.id, allDomains);
      
      // Update the scan record with the task ID
      await db.update(scans)
        .set({ taskId })
        .where(eq(scans.id, scan.id));
      
      // Return response
      return res.status(200).json({
        scanId: scan.id,
        taskId,
        status: 'queued',
        creditsCharged: creditCost
      });
    } catch (queueError) {
      // Failed to queue, refund credits and update status
      await refundCredits(req.user.id, creditCost, 'scan_failed', {
        scanId: scan.id,
        reason: 'queue_error'
      });
      
      await db.update(scans)
        .set({ status: 'failed' })
        .where(eq(scans.id, scan.id));
      
      return res.status(500).json({
        error: 'Failed to queue scan',
        message: queueError.message
      });
    }
  } catch (error) {
    console.error('Error starting scan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get scan status
 * GET /api/scan/:scanId
 */
router.get('/:scanId', requireAuth, async (req: Request, res: Response) => {
  try {
    const scanId = req.params.scanId;
    
    // Find the scan
    const [scan] = await db.select()
      .from(scans)
      .where(eq(scans.id, scanId));
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    // Check if the scan belongs to the user
    if (scan.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this scan' });
    }
    
    return res.json(scan);
  } catch (error) {
    console.error('Error fetching scan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get all scans for the user
 * GET /api/scan
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Find all scans for the user, ordered by creation date (newest first)
    const userScans = await db.select()
      .from(scans)
      .where(eq(scans.userId, req.user.id))
      .orderBy(scans.createdAt, 'desc');
    
    return res.json(userScans);
  } catch (error) {
    console.error('Error fetching scans:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;