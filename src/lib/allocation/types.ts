export interface AllocationMemberCandidate {
  id: string;
  registrationNo: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  category: string;
  isDeacon: boolean;
  status: string;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  code: string;
  targetPercent: number; // e.g. 0.25
  maxCapacity: number;   // M_d
  priority: number;      // 1 = highest
  currentActiveAllocationsCount: number;
  eligibilityRules: {
    allowedGenders: string;      // "ALL" | "MALE" | "FEMALE"
    allowedCategories: string;   // JSON array or "ALL"
    requiresDeacon: boolean | null;
  }[];
  balancingRules: {
    constraintType: string;      // "HARD" | "SOFT"
    targetMaleRatio: number | null;
    targetFemaleRatio: number | null;
    minCategoryQuota: string | null; // JSON
    maxCategoryQuota: string | null; // JSON
    deaconQuota: number | null;
  }[];
}

export interface ProposedAssignment {
  memberId: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  reasonCode: "TARGET_MATCH" | "PRIORITY_TIE_BREAKER" | "BALANCING_FIT" | "SINGLE_ELIGIBLE";
  reasonDetail: string;
}

export interface AllocationExceptionItem {
  memberId: string;
  reasonCode: "NO_ELIGIBLE_DEPARTMENT" | "CAPACITY_FULL" | "CONFLICT_UNRESOLVED";
  reasonDetail: string;
}

export interface DepartmentTargetCalculation {
  departmentId: string;
  departmentName: string;
  eligibleCount: number;      // E_d
  targetPercent: number;      // p_d
  calculatedTarget: number;   // T_d = round(E_d * p_d)
  maxCapacity: number;        // M_d
  existingCount: number;      // Currently active before this batch
  effectiveCapacityRemaining: number; // min(T_d, M_d - existingCount)
  allocatedInProposal: number;// A_d
  targetStatus: "TARGET_ACHIEVED" | "PARTIALLY_ACHIEVED" | "MAX_CAPACITY_REACHED" | "NO_ELIGIBLE_AVAILABLE";
}

export interface AllocationEngineResult {
  totalUnassignedMembers: number;
  departmentCalculations: Record<string, DepartmentTargetCalculation>;
  proposals: ProposedAssignment[];
  exceptions: AllocationExceptionItem[];
  summary: {
    totalAllocated: number;
    totalExceptions: number;
    timestamp: string;
  };
}

