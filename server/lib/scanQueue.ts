/**
 * Scan Queue Manager
 * This is a stub implementation that will be replaced with a proper queue system like BullMQ
 * in the future. For now, it just logs the scan request and returns a mock task ID.
 */

/**
 * Queue a scan task for processing
 * @param scanId The ID of the scan record
 * @param domains Array of domains to scan (primary URL and competitors)
 * @returns A task ID for the queued job
 */
export async function queueScanTask(scanId: string, domains: string[]): Promise<string> {
  console.log(`[queue] Queuing scan ${scanId} for:`, domains);
  
  // This is a stub implementation. In a real system, this would add the job to a queue
  // using something like BullMQ, and workers would pick up the job and process it.
  
  return `queued-task-id-${scanId}`;
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