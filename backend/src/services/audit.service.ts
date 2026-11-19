export interface AuditLogRecord {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  campusId?: string | null;
  campusName?: string | null;
  entityType: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: "aud-00000000-0000-0000-0000-000000000001",
    action: "SYSTEM_INITIALIZED",
    actorId: "f0000000-0000-0000-0000-000000000001",
    actorEmail: "admin@c-cimas.org",
    actorRole: "ADMIN",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    entityType: "SYSTEM",
    entityId: "C-CIMAS",
    details: {
      message: "C-CIMAS Church Campus Allocation System schema initialized with 2 strict roles (ADMIN, EVALUATOR).",
    },
    ipAddress: "127.0.0.1",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "aud-00000000-0000-0000-0000-000000000002",
    action: "PERCENTAGE_TARGETS_CONFIGURED",
    actorId: "f0000000-0000-0000-0000-000000000001",
    actorEmail: "admin@c-cimas.org",
    actorRole: "ADMIN",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    entityType: "TARGET_CONFIGURATION",
    entityId: "tc000000-0000-0000-0000-000000000001",
    details: {
      cycleName: "2026/2027 Main Campus Annual Allocation",
      targets: [
        { departmentCode: "CHOIR-01", percentage: 30 },
        { departmentCode: "TEACH-01", percentage: 25 },
        { departmentCode: "PRAY-01", percentage: 20 },
        { departmentCode: "EVANG-01", percentage: 15 },
        { departmentCode: "SOC-01", percentage: 10 },
      ],
      sumPercentage: 100,
      validation: "EXACT_100_PERCENT_SATISFIED",
    },
    ipAddress: "127.0.0.1",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "aud-00000000-0000-0000-0000-000000000003",
    action: "EXCEL_IMPORT_BATCH_COMPLETED",
    actorId: "f0000000-0000-0000-0000-000000000001",
    actorEmail: "admin@c-cimas.org",
    actorRole: "ADMIN",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    entityType: "IMPORT_BATCH",
    entityId: "b0000000-0000-0000-0000-000000000001",
    details: {
      fileName: "Main_Campus_Fall_Registrations.xlsx",
      totalRows: 1200,
      validRows: 1200,
      invalidRows: 0,
      importedCount: 1200,
    },
    ipAddress: "127.0.0.1",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export let auditLogsStore: AuditLogRecord[] = [...INITIAL_AUDIT_LOGS];

export class AuditService {
  static async log(entry: {
    action: string;
    actorId: string;
    actorEmail: string;
    actorRole: string;
    campusId?: string | null;
    campusName?: string | null;
    entityType: string;
    entityId?: string;
    details: Record<string, any>;
    ipAddress?: string;
  }): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      action: entry.action,
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      actorRole: entry.actorRole,
      campusId: entry.campusId || null,
      campusName: entry.campusName || null,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: entry.ipAddress || "127.0.0.1",
      createdAt: new Date().toISOString(),
    };

    auditLogsStore.unshift(record);
    return record;
  }

  static async getAll(params?: {
    campusId?: string;
    action?: string;
    entityType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let logs = [...auditLogsStore];

    if (params?.campusId) {
      logs = logs.filter((l) => l.campusId === params.campusId);
    }

    if (params?.action) {
      logs = logs.filter((l) => l.action.toLowerCase() === params.action!.toLowerCase());
    }

    if (params?.entityType) {
      logs = logs.filter((l) => l.entityType.toLowerCase() === params.entityType!.toLowerCase());
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.actorEmail.toLowerCase().includes(q) ||
          JSON.stringify(l.details).toLowerCase().includes(q)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = logs.slice((page - 1) * limit, page * limit);

    return {
      logs: paginated,
      pagination: { page, limit, total, totalPages },
    };
  }
}

