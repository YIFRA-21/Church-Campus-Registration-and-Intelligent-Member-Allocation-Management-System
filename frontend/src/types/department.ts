export type DepartmentStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface DepartmentStatusHistory {
  id: string;
  departmentId: string;
  oldStatus: DepartmentStatus;
  newStatus: DepartmentStatus;
  reason: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

export interface DepartmentCapacityHistory {
  id: string;
  departmentId: string;
  campusId: string;
  previousCapacity: number;
  newCapacity: number;
  changedBy: string;
  changedByName: string;
  changeReason: string;
  confirmationRequired: boolean;
  confirmationGiven: boolean;
  changedAt: string;
}

export interface EligibilityRule {
  id?: string;
  departmentId?: string;
  ruleName: string;
  ruleType: string;
  operator: string;
  value: any;
  isMandatory: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  campusId: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  allocatedMembersCount: number;
  targetPercentage: number;
  priority: number;
  status: DepartmentStatus;
  isActive: boolean;
  overCapacity?: boolean;
  statusHistory?: DepartmentStatusHistory[];
  capacityHistory?: DepartmentCapacityHistory[];
  eligibilityRules?: EligibilityRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  campusId: string;
  code: string;
  name: string;
  description?: string;
  capacity: number;
  targetPercentage: number;
  priority: number;
  status?: DepartmentStatus;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  capacity?: number;
  targetPercentage?: number;
  priority?: number;
  isActive?: boolean;
  status?: DepartmentStatus;
}

export interface TargetItem {
  departmentId: string;
  percentage: number;
}

export interface CalculatedTarget {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  percentage: number;
  exactShare: number;
  targetCount: number;
  remainder: number;
}

export interface TargetConfiguration {
  id: string;
  campusId: string;
  cycleName: string;
  targets: TargetItem[];
  projectedAllocations?: CalculatedTarget[];
  isActive: boolean;
  version: number;
  finalizedBy?: string;
  finalizedByName?: string;
  createdAt: string;
}

export interface TargetValidationResult {
  isValid: boolean;
  sum: number;
  difference: number;
  projectedAllocations: CalculatedTarget[];
  shortfalls: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    capacity: number;
    projectedTarget: number;
    shortfall: number;
  }[];
  message: string;
}

export interface TargetSimulationResult {
  totalAllocatedTarget: number;
  targets: CalculatedTarget[];
}

export interface DepartmentDashboardSummary {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  archivedDepartments: number;
  nearCapacityCount: number;
  overCapacityCount: number;
  totalCapacity: number;
  totalAllocated: number;
  overallUtilization: number;
  isTargetConfigured: boolean;
  isTargetSumValid: boolean;
  currentTargetSum: number;
  currentTargetCycleName: string;
}

export interface DepartmentRosterHeader {
  id: string;
  campusId: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  targetPercentage: number;
  allocatedMembersCount: number;
  remainingCapacity: number;
  capacityUtilization: number;
}

export interface DepartmentAnalytics {
  totalAllocated: number;
  menCount: number;
  womenCount: number;
  menPercentage: number;
  womenPercentage: number;
  deaconsCount: number;
  servantsCount: number;
  regularCount: number;
  activeCount: number;
  sundaySchoolTotal: number;
  sundaySchoolSenior: number;
  sundaySchoolMid: number;
  sundaySchoolJunior: number;
  averageAge: number;
}

export interface DepartmentRosterResponse {
  department: DepartmentRosterHeader;
  analytics?: DepartmentAnalytics;
  members: import("./member").Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
