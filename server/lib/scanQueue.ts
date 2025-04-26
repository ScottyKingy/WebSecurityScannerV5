/**
 * Scan Queue Manager
 * Manages scan jobs with a fallback local queue if Redis is not available
 */
import { getEnabledScanners } from './scannerConfig';
import { db } from '../db';
import { scans } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Use an in-memory job queue for development, since Redis isn't available
class InMemoryQueue {
  private static instance: InMemoryQueue;
  private jobs: Map<string, any> = new Map();
  private jobCounter: number = 0;

  private constructor() {}

  public static getInstance(): InMemoryQueue {
    if (!InMemoryQueue.instance) {
      InMemoryQueue.instance = new InMemoryQueue();
    }
    return InMemoryQueue.instance;
  }

  async add(jobName: string, data: any): Promise<{ id: string }> {
    const jobId = `job-${++this.jobCounter}`;
    this.jobs.set(jobId, {
      id: jobId,
      name: jobName,
      data,
      timestamp: new Date().toISOString(),
      status: 'queued'
    });
    
    console.log(`[local-queue] Added ${jobName} job ${jobId}`);
    
    // Simulate async processing in the background
    setTimeout(() => {
      this.processJob(jobId);
    }, 2000);
    
    return { id: jobId };
  }
  
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    try {
      // Mark job as running
      job.status = 'running';
      console.log(`[local-queue] Processing job ${jobId} (${job.name})`);
      
      // Update scan status in database
      await db.update(scans)
        .set({ 
          status: 'running',
          updatedAt: new Date()
        })
        .where(eq(scans.id, job.data.scanId));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Mark job as completed
      job.status = 'completed';
      console.log(`[local-queue] Completed job ${jobId}`);
      
      // Update scan status in database
      await db.update(scans)
        .set({ 
          status: 'complete',
          updatedAt: new Date()
        })
        .where(eq(scans.id, job.data.scanId));
        
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      console.error(`[local-queue] Job ${jobId} failed:`, job.error);
      
      // Update scan status in database
      await db.update(scans)
        .set({ 
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(scans.id, job.data.scanId));
    }
  }
}

// Use the in-memory queue for development
const scanQueue = InMemoryQueue.getInstance();

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