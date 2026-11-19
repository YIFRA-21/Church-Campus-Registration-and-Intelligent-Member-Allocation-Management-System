export interface AllocationTarget {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  targetPercentage: number;
  targetCount: number;
  allocatedCount: number;
  capacity: number;
}

export interface AllocationBatch {
  id: string;
  campusId: string;
  cycleName: string;
  totalMembers: number;
  allocatedCount: number;
  exceptionCount: number;
  status: "DRAFT" | "PREVIEW_READY" | "APPROVED" | "CANCELLED";
  targets: AllocationTarget[];
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberAllocation {
  id: string;
  batchId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  gender: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  allocationStatus: "PROPOSED" | "COMMITTED" | "REASSIGNED";
  allocationMethod: "AUTOMATIC" | "MANUAL_OVERRIDE";
  reasonCode: string;
  overrideReason?: string;
  createdAt: string;
}

export interface AllocationException {
  id: string;
  batchId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  gender: string;
  campusId: string;
  exceptionType: "NO_ELIGIBLE_DEPARTMENT" | "CAPACITY_EXCEEDED" | "MANUAL_HOLD";
  reason: string;
  eligibleDepartments: { id: string; code: string; name: string }[];
  resolutionStatus: "PENDING" | "RESOLVED" | "ON_HOLD";
  resolvedDepartmentId?: string;
  resolvedDepartmentName?: string;
  resolvedBy?: string;
  resolutionReason?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ResolveExceptionPayload {
  action: "ASSIGN" | "OVERRIDE" | "HOLD";
  departmentId?: string;
  justification: string;
}

