export interface DashboardAnalytics {
  campusesCount: number;
  activeCampuses?: number;
  departmentsCount: number;
  activeDepartments?: number;
  totalMembers: number;
  activeMembers?: number;
  inactiveMembers?: number;
  suspendedMembers?: number;
  allocatedMembers: number;
  unallocatedMembers: number;
  allocationPercentage: number;
  totalCapacity?: number;
  capacityUtilization?: number;
  ordainedDeacons?: number;
  servants?: number;
  regularFaithful?: number;
  totalUsers?: number;
  totalRoles?: number;
  auditLogsCount?: number;
  pendingExceptionsCount: number;
  totalEvaluationTasks: number;
  completedEvaluationTasks: number;
  averageAge?: number;
  demographics: {
    gender: Record<string, number>;
    category: Record<string, number>;
    spiritualStatus: Record<string, number>;
    originRegion?: Record<string, number>;
    academicDepartment?: Record<string, number>;
    language?: Record<string, number>;
  };
  departmentStats: {
    id: string;
    code: string;
    name: string;
    targetPercentage: number;
    targetCount: number;
    allocatedCount: number;
    capacity: number;
    remainingCapacity: number;
    achievementRate: number;
    capacityRate: number;
  }[];
}

export interface DepartmentDistributionReport {
  campus: {
    id: string;
    code: string;
    name: string;
  };
  totalCampusMembers: number;
  departments: {
    departmentId: string;
    code: string;
    name: string;
    targetPercentage: number;
    targetCount: number;
    allocatedCount: number;
    capacity: number;
    remainingCapacity: number;
    variance: number;
    achievementPct: number;
  }[];
}

export interface EvaluatorPerformanceItem {
  evaluatorId: string;
  fullName: string;
  email: string;
  assignedTasksCount: number;
  totalCandidates: number;
  completedAssessments: number;
  pendingAssessments: number;
  completionRate: number;
  averageScore: number;
}

export interface AuditLogItem {
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

export interface AuditLogResponse {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

