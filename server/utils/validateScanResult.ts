/**
 * Validation for scan result data
 */
import { z } from "zod";

/**
 * Schema for scan result JSON validation
 * Ensures consistent output format from all scanners
 */
export const ScanResultSchema = z.object({
  score: z.number().min(0).max(100),
  percentile_contribution: z.number().min(0).max(1),
  summary: z.string(),
  details: z.string(),
  issues: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]),
    impact_area: z.array(z.string()),
    effort_estimate: z.enum(["low", "medium", "high"]),
    recommendation: z.string()
  })),
  remediation_plan: z.array(z.object({
    title: z.string(),
    category: z.string(),
    impact_score: z.number(),
    effort_score: z.number(),
    priority: z.enum(["low", "medium", "high"])
  })),
  charts: z.object({
    type: z.string(),
    data: z.record(z.any())
  }),
  metadata: z.object({
    scanner_key: z.string(),
    scanner_version: z.string(),
    executed_at: z.string()
  })
});

/**
 * Type for scan result data
 */
export type ScanResultOutput = z.infer<typeof ScanResultSchema>;

/**
 * Validates scan output against the schema
 * @param data Output data from scanner
 * @returns Validated data or throws error
 */
export function validateScanOutput(data: any): ScanResultOutput {
  return ScanResultSchema.parse(data);
}

/**
 * Safely validates scan output
 * @param data Output data from scanner
 * @returns [data, null] if valid or [null, error] if invalid
 */
export function validateScanOutputSafe(data: any): [ScanResultOutput | null, z.ZodError | null] {
  try {
    const validated = ScanResultSchema.parse(data);
    return [validated, null];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return [null, error];
    }
    // Convert non-Zod errors to a similar format
    return [null, new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: [],
        message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      }
    ])];
  }
}