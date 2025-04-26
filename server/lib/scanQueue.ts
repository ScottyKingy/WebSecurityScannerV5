/**
 * Scan Queue Manager
 * Manages scan jobs with a fallback local queue if Redis is not available
 */
import { getEnabledScanners, loadScannerConfig } from './scannerConfig';
import { runScannerPrompt } from './openaiService';
import { db } from '../db';
import { scans, scanResults } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { httpClient } from './httpClient';
import { validateScanOutputSafe } from '../utils/validateScanResult';

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
      
      // Get scan data
      const { scanId, domains, scannerKeys } = job.data;
      
      // Fetch content for each domain (in a real system, this would make HTTP requests)
      const results = {};
      
      for (const domain of domains) {
        try {
          console.log(`[scan] Fetching content for ${domain}`);
          
          // In a real system, this would be an actual HTTP request to the domain
          // For now, we'll simulate with a mock response
          const mockHtmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Sample Website - ${domain}</title>
                <meta name="description" content="Sample website for ${domain}">
              </head>
              <body>
                <h1>Welcome to ${domain}</h1>
                <p>This is a sample website for testing the scanner.</p>
                <div class="content">
                  <h2>Our Services</h2>
                  <ul>
                    <li>Service 1</li>
                    <li>Service 2</li>
                    <li>Service 3</li>
                  </ul>
                </div>
                <script src="script.js"></script>
              </body>
            </html>
          `;
          
          // For each enabled scanner, process the content with OpenAI
          const domainResults = {};
          
          for (const scannerKey of scannerKeys) {
            try {
              // Get scanner configuration
              const scannerConfig = loadScannerConfig(scannerKey);
              
              if (!scannerConfig) {
                console.warn(`[scan] Scanner ${scannerKey} configuration not found, skipping`);
                continue;
              }
              
              console.log(`[scan] Running ${scannerKey} scanner on ${domain}`);
              
              // Call the OpenAI service to analyze the content
              const openAiResponse = await runScannerPrompt(
                scannerKey,
                mockHtmlContent,
                { domain, scanId }
              );
              
              // Convert OpenAI response to standard scan result format
              const standardizedResult = {
                score: Math.floor(Math.random() * 100), // In production this would be calculated from metrics
                percentile_contribution: Math.random(), // In production this would be calculated based on scanner weight
                summary: openAiResponse?.summary || "Analysis complete",
                details: `Detailed analysis of ${domain} using ${scannerKey} scanner`,
                issues: openAiResponse?.metrics?.map((metric: any) => ({
                  id: `${scannerKey.toUpperCase()}-${metric.key || 'unknown'}`,
                  title: metric.name || 'Unnamed Metric',
                  description: metric.details || "",
                  severity: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as "low" | "medium" | "high" | "critical",
                  impact_area: ["SEO", "Performance", "Accessibility", "User Experience"],
                  effort_estimate: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
                  recommendation: metric.details || "Implement best practices"
                })) || [],
                remediation_plan: [
                  {
                    title: "Improve website structure",
                    category: scannerKey,
                    impact_score: Math.floor(Math.random() * 10),
                    effort_score: Math.floor(Math.random() * 10),
                    priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)]
                  }
                ],
                charts: {
                  type: "bar",
                  data: {
                    labels: ["Passed", "Warnings", "Failed"],
                    values: [Math.random() * 10, Math.random() * 10, Math.random() * 10]
                  }
                },
                metadata: {
                  scanner_key: scannerKey,
                  scanner_version: "v1.0",
                  executed_at: new Date().toISOString()
                }
              };
              
              // Validate the result against our schema
              const [validatedResult, validationError] = validateScanOutputSafe(standardizedResult);
              
              if (validationError) {
                console.error(`[scan] Validation error for ${scannerKey} result:`, validationError);
                throw new Error(`Result validation failed for ${scannerKey}: ${validationError.message}`);
              }
              
              if (!validatedResult) {
                throw new Error(`Failed to validate scan result for ${scannerKey}`);
              }
              
              // Store the validated result in the new scan_results table
              try {
                await db.insert(scanResults).values({
                  scanId,
                  scannerKey,
                  score: validatedResult.score,
                  outputJson: JSON.stringify(validatedResult),
                  promptLog: JSON.stringify(openAiResponse || {}) // Store raw OpenAI response for debugging
                });
                console.log(`[scan] Saved ${scannerKey} result to database for scan ${scanId}`);
              } catch (dbError) {
                console.error(`[scan] Error saving scan result to database:`, dbError);
                throw dbError;
              }
              
              // Store the raw results in the legacy format
              if (typeof domainResults === 'object') {
                domainResults[scannerKey] = openAiResponse;
              }
              
              console.log(`[scan] ${scannerKey} scan complete for ${domain} with ${openAiResponse?.metrics?.length || 0} metrics`);
            } catch (scannerError: unknown) {
              console.error(`[scan] Error running ${scannerKey} scanner on ${domain}:`, scannerError);
              if (typeof domainResults === 'object') {
                domainResults[scannerKey] = { error: scannerError instanceof Error ? scannerError.message : String(scannerError) };
              }
            }
          }
          
          if (typeof results === 'object') {
            results[domain] = domainResults;
          }
        } catch (domainError: unknown) {
          console.error(`[scan] Error processing ${domain}:`, domainError);
          if (typeof results === 'object') {
            results[domain] = { error: domainError instanceof Error ? domainError.message : String(domainError) };
          }
        }
      }
      
      // Store the results in the database
      await db.update(scans)
        .set({ 
          status: 'complete',
          results: JSON.stringify(results),
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(scans.id, scanId));
      
      // Mark job as completed
      job.status = 'completed';
      job.results = results;
      console.log(`[local-queue] Completed job ${jobId}`);
      
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      console.error(`[local-queue] Job ${jobId} failed:`, job.error);
      
      // Update scan status in database
      await db.update(scans)
        .set({ 
          status: 'failed',
          error: job.error,
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