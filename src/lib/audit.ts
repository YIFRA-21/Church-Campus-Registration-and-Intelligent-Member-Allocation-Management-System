import { db } from "@/lib/db";

export interface LogAuditParams {
  campusId?: string | null;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  reason?: string | null;
  ipAddress?: string | null;
}

export async function logAudit(params: LogAuditParams) {
  try {
    return await db.auditLog.create({
      data: {
        campusId: params.campusId || null,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        reason: params.reason || null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Non-blocking catch to ensure core transaction isn't broken if logging has transient issue,
    // but console log for diagnostics
    console.error("Audit logging error:", error);
  }
}

