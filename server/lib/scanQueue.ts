/**
 * Scan Queue Manager
 * Manages scan jobs using BullMQ queue system
 */
import { Queue } from 'bullmq';
import { getEnabledScanners } from './scannerConfig';
import { db } from '../db';
import { scans } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Create a BullMQ queue for scan jobs
// Note: In a real production environment, you'd configure Redis connection settings from environment variables
const scanQueue = new Queue('scan-jobs', {
  connection: { 
    host: process.env.REDIS_HOST || 'localhost', 
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  // If Redis connection fails, fall back to local processing mode
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

/**
 * Queue a scan task for processing
 * @param scanId The ID of the scan record
 * @param domains Array of domains to scan (primary URL and competitors)
 * @returns A task ID for the queued job
 */
export async function queueScanTask(scanId: string, domains: string[]): Promise<string> {
  console.log(`[queue] Queuing scan ${scanId} for:`, domains);
  
  // Get enabled scanners from configuration
  const scannerKeys = getEnabledScanners();
  console.log(`[queue] Using scanners: ${scannerKeys.join(', ')}`);
  
  try {
    // Add the job to the queue
    const job = await scanQueue.add('runScan', {
      scanId,
      domains,
      scannerKeys,
      timestamp: new Date().toISOString()
    });
    
    // TypeScript typings for BullMQ are sometimes imperfect, so we handle possible undefined
    const jobId = job.id || `queue-job-${Date.now()}`;
    console.log(`[queue] Successfully queued job ${jobId} for scan ${scanId}`);
    return jobId.toString();
  } catch (error) {
    console.error(`[queue] Error queuing scan ${scanId}:`, error);
    
    // If queue fails, update scan status to 'failed'
    try {
      await db.update(scans)
        .set({ status: 'failed' })
        .where(eq(scans.id, scanId));
    } catch (dbError) {
      console.error(`[queue] Error updating scan status:`, dbError);
    }
    
    throw new Error(`Failed to queue scan job: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate URL format
 * Basic validation to ensure URLs are properly formatted and don't contain malicious code
 * @param url URL to validate
 * @returns Boolean indicating if URL is valid
 */
export function validateUrl(url: string): boolean {
  // Check for basic URL format (https:// or http://)
  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  
  if (!urlPattern.test(url)) {
    return false;
  }
  
  // Check for potential script injection
  if (url.includes('javascript:') || url.includes('data:') || url.includes('<script>')) {
    return false;
  }
  
  return true;
}

/**
 * Calculate scan type based on competitors
 * @param competitorCount Number of competitor URLs
 * @returns Scan type (single, multi, competitor)
 */
export function determineScanType(competitorCount: number): 'single' | 'multi' | 'competitor' {
  if (competitorCount === 0) {
    return 'single';
  } else if (competitorCount === 1) {
    return 'multi';
  } else {
    return 'competitor';
  }
}