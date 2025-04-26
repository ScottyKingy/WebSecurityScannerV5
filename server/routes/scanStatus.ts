import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { scans } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Get scan status with additional metadata
 * GET /api/scan-status/:scanId
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
    
    // Return formatted status response
    return res.json({
      status: scan.status,
      taskId: scan.taskId,
      startedAt: scan.createdAt,
      updatedAt: scan.updatedAt,
      completed: scan.status === 'complete',
      failed: scan.status === 'failed',
      inProgress: scan.status === 'running' || scan.status === 'queued',
      scanType: scan.scanType,
      scannerKeys: scan.scannerKeys || [],
      primaryUrl: scan.primaryUrl,
      competitorCount: scan.competitors.length
    });
  } catch (error) {
    console.error('Error fetching scan status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;