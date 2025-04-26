import { db } from '../db';
import { auditLogs } from '@shared/schema';

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
      details
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
    
    // Build query conditions
    const conditions = [];
    
    if (userId) {
      conditions.push(auditLogs.userId.equals(userId));
    }
    
    if (action) {
      conditions.push(auditLogs.action.equals(action));
    }
    
    if (startDate) {
      conditions.push(auditLogs.createdAt.gte(startDate));
    }
    
    if (endDate) {
      conditions.push(auditLogs.createdAt.lte(endDate));
    }
    
    // Execute query with filters
    const query = db.select().from(auditLogs);
    
    if (conditions.length > 0) {
      query.where(conditions.reduce((acc, condition) => acc.and(condition)));
    }
    
    const logs = await query
      .orderBy(auditLogs.createdAt.desc())
      .limit(limit)
      .offset(offset);
      
    return logs;
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
}