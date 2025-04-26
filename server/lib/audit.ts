import { db } from '../db';
import { auditLogs } from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

/**
 * Log an admin action to the audit trail
 * @param userId ID of the admin user performing the action
 * @param action String identifier for the action being performed
 * @param details JSON object with additional details about the action
 */
export async function logAdminAction(userId: string, action: string, details: Record<string, any> = {}) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      details: JSON.stringify(details)
    });
  } catch (error) {
    // Log the error but don't throw - audit logging should not block operations
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Get audit logs with optional filtering
 * @param params Filter parameters
 */
export async function getAuditLogs(params: {
  userId?: string;
  action?: string; 
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const { userId, action, startDate, endDate, limit = 50, offset = 0 } = params;
    
    // Start with a base query
    let query = db.select().from(auditLogs);
    
    // Apply filters if provided
    if (userId) {
      query = query.where(eq(auditLogs.userId, userId));
    }
    
    if (action) {
      query = query.where(eq(auditLogs.action, action));
    }
    
    if (startDate) {
      query = query.where(gte(auditLogs.createdAt, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(auditLogs.createdAt, endDate));
    }
    
    // Apply order and pagination
    const logs = await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
      
    // Parse the details JSON string back to an object
    return logs.map(log => ({
      ...log,
      details: JSON.parse(log.details as string)
    }));
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
}