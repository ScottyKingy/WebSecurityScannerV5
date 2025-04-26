/**
 * Scanner API routes
 */
import express, { Request, Response } from 'express';
import { requireAuth, requireTier } from '../middleware/auth';
import { getEnabledScanners, loadScannerConfig } from '../lib/scannerConfig';
import { checkOpenAIServiceHealth, getAvailableScanners } from '../lib/openaiService';

const router = express.Router();

/**
 * Get a list of available scanners
 * GET /api/scanners
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Get user tier to filter available scanners
    const userTier = req.user?.tier || 'anonymous';
    
    // Get scanners from configuration files
    const enabledScanners = getEnabledScanners();
    
    // Load scanner details and filter by tier access
    const scanners = enabledScanners.map(key => {
      const config = loadScannerConfig(key);
      
      if (!config) return null;
      
      // Check if this scanner is available for the user's tier
      const tierAccess = config.tierAccess || [];
      const hasAccess = tierAccess.includes(userTier);
      
      return {
        key: config.scannerKey,
        name: config.name,
        description: config.description,
        credits: config.creditsPerScan || 1,
        available: hasAccess,
        processingTime: config.processingTimeEstimate || 60
      };
    }).filter(scanner => scanner !== null);
    
    res.json({ scanners });
  } catch (error) {
    console.error('Error fetching scanners:', error);
    res.status(500).json({ error: 'Failed to fetch scanners' });
  }
});

/**
 * Get scanner details
 * GET /api/scanners/:key
 */
router.get('/:key', requireAuth, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const config = loadScannerConfig(key);
    
    if (!config) {
      return res.status(404).json({ error: 'Scanner not found' });
    }
    
    // Get user tier to check access
    const userTier = req.user?.tier || 'anonymous';
    
    // Check if this scanner is available for the user's tier
    const tierAccess = config.tierAccess || [];
    const hasAccess = tierAccess.includes(userTier);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `The ${config.name} scanner requires a ${tierAccess[0] || 'higher'} tier subscription`
      });
    }
    
    // Return scanner details
    res.json({
      key: config.scannerKey,
      name: config.name,
      description: config.description,
      metrics: config.metrics.map((m: any) => ({
        key: m.key,
        name: m.name,
        description: m.description,
        unit: m.unit
      })),
      credits: config.creditsPerScan || 1,
      processingTime: config.processingTimeEstimate || 60
    });
  } catch (error) {
    console.error(`Error fetching scanner details for ${req.params.key}:`, error);
    res.status(500).json({ error: 'Failed to fetch scanner details' });
  }
});

/**
 * Check OpenAI service health
 * GET /api/scanners/system/health
 */
router.get('/system/health', requireAuth, requireTier('enterprise'), async (req: Request, res: Response) => {
  try {
    const health = await checkOpenAIServiceHealth();
    res.json(health);
  } catch (error) {
    console.error('Error checking OpenAI service health:', error);
    res.status(500).json({ 
      healthy: false,
      status: 'error',
      message: 'Failed to check service health'
    });
  }
});

export default router;