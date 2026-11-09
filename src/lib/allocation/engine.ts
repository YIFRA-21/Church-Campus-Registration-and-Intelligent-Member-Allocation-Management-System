import {
  AllocationMemberCandidate,
  DepartmentConfig,
  ProposedAssignment,
  AllocationExceptionItem,
  DepartmentTargetCalculation,
  AllocationEngineResult,
} from "./types";
import { isMemberEligibleForDepartment } from "./eligibility";

/**
 * Deterministic pseudo-random string hash for reproducible tie-breaking
 */
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function runIntelligentAllocationEngine(
  members: AllocationMemberCandidate[],
  departments: DepartmentConfig[]
): AllocationEngineResult {
  // Step 1: Validate allocation configuration
  if (!departments || departments.length === 0) {
    throw new Error("No active departments available for allocation.");
  }

  // Step 2: Build candidate populations (per-department eligibility evaluation)
  const deptEligibleMembersMap: Record<string, AllocationMemberCandidate[]> = {};
  const memberEligibleDeptsMap: Record<string, DepartmentConfig[]> = {};

  for (const dept of departments) {
    deptEligibleMembersMap[dept.id] = [];
  }
  for (const member of members) {
    memberEligibleDeptsMap[member.id] = [];
  }

  for (const member of members) {
    for (const dept of departments) {
      const { eligible } = isMemberEligibleForDepartment(member, dept);
      if (eligible) {
        deptEligibleMembersMap[dept.id].push(member);
        memberEligibleDeptsMap[member.id].push(dept);
      }
    }
  }

  // Step 3: Calculate department targets
  // E_d = eligible unassigned count
  // p_d = target percentage
  // T_d = round(E_d * p_d)
  // Effective remaining capacity = min(T_d, M_d - existingCount)
  const calculations: Record<string, DepartmentTargetCalculation> = {};
  const effectiveLimits: Record<string, number> = {};

  for (const dept of departments) {
    const eligibleCount = deptEligibleMembersMap[dept.id].length;
    const targetPercent = dept.targetPercent;
    const calculatedTarget = Math.round(eligibleCount * targetPercent);
    const availableSlots = Math.max(0, dept.maxCapacity - dept.currentActiveAllocationsCount);
    const effectiveLimit = Math.min(calculatedTarget, availableSlots);

    effectiveLimits[dept.id] = effectiveLimit;

    calculations[dept.id] = {
      departmentId: dept.id,
      departmentName: dept.name,
      eligibleCount,
      targetPercent,
      calculatedTarget,
      maxCapacity: dept.maxCapacity,
      existingCount: dept.currentActiveAllocationsCount,
      effectiveCapacityRemaining: effectiveLimit,
      allocatedInProposal: 0,
      targetStatus: "PARTIALLY_ACHIEVED",
    };
  }

  // Step 4 & 5: Resolve overlapping eligibility, prioritize, and balance
  const proposals: ProposedAssignment[] = [];
  const exceptions: AllocationExceptionItem[] = [];
  const assignedMemberIds = new Set<string>();
  const deptAllocatedCount: Record<string, number> = {};
  const deptGenderCount: Record<string, { MALE: number; FEMALE: number }> = {};
  const deptCategoryCount: Record<string, Record<string, number>> = {};

  for (const dept of departments) {
    deptAllocatedCount[dept.id] = 0;
    deptGenderCount[dept.id] = { MALE: 0, FEMALE: 0 };
    deptCategoryCount[dept.id] = {};
  }

  // Sort members: Members eligible for FEWER departments first (most constrained),
  // then members with deacon status or specific categories
  const sortedMembers = [...members].sort((a, b) => {
    const deptsA = memberEligibleDeptsMap[a.id].length;
    const deptsB = memberEligibleDeptsMap[b.id].length;
    if (deptsA !== deptsB) return deptsA - deptsB;
    // Tie-breaker
    return stableHash(a.id) - stableHash(b.id);
  });

  // Allocation matching loop
  for (const member of sortedMembers) {
    const eligibleDepts = memberEligibleDeptsMap[member.id];

    if (eligibleDepts.length === 0) {
      exceptions.push({
        memberId: member.id,
        reasonCode: "NO_ELIGIBLE_DEPARTMENT",
        reasonDetail: `Member attributes (Gender: ${member.gender}, Category: ${member.category}, Deacon: ${member.isDeacon ? "Yes" : "No"}) do not match any active department eligibility criteria. Routed for administrator review.`,
      });
      continue;
    }

    // Filter departments that still have available capacity under effectiveLimits
    const availableDepts = eligibleDepts.filter(
      (d) => deptAllocatedCount[d.id] < effectiveLimits[d.id]
    );

    if (availableDepts.length === 0) {
      exceptions.push({
        memberId: member.id,
        reasonCode: "CAPACITY_FULL",
        reasonDetail: `Eligible for ${eligibleDepts.map((d) => d.name).join(", ")}, but calculated targets or capacity maximums have been reached.`,
      });
      continue;
    }

    // Step 4: Resolve choice when member qualifies for multiple available departments
    let chosenDept: DepartmentConfig;
    let assignmentReasonCode: ProposedAssignment["reasonCode"] = "TARGET_MATCH";
    let assignmentReasonDetail = "";

    if (availableDepts.length === 1) {
      chosenDept = availableDepts[0];
      assignmentReasonCode = "SINGLE_ELIGIBLE";
      assignmentReasonDetail = `Only department with available capacity matching member criteria (${chosenDept.name}).`;
    } else {
      // Rank available departments by:
      // 1. Deficit ratio (how far behind the department is from reaching effectiveLimit)
      // 2. Department configured priority (1 is highest)
      // 3. Gender/category balancing score
      // 4. Deterministic tie-breaker
      const scoredDepts = availableDepts.map((d) => {
        const allocated = deptAllocatedCount[d.id];
        const target = effectiveLimits[d.id];
        const deficitRatio = target > 0 ? (target - allocated) / target : 0;
        const priorityScore = 100 - Math.min(d.priority * 10, 90); // higher is better

        // Balancing preference score
        let balanceScore = 0;
        const balancing = d.balancingRules[0];
        if (balancing) {
          const mCount = deptGenderCount[d.id].MALE;
          const fCount = deptGenderCount[d.id].FEMALE;
          const totalG = mCount + fCount;
          if (member.gender === "MALE" && balancing.targetMaleRatio !== null) {
            const currentRatio = totalG > 0 ? mCount / totalG : 0;
            if (currentRatio < balancing.targetMaleRatio) balanceScore += 15;
          } else if (member.gender === "FEMALE" && balancing.targetFemaleRatio !== null) {
            const currentRatio = totalG > 0 ? fCount / totalG : 0;
            if (currentRatio < balancing.targetFemaleRatio) balanceScore += 15;
          }
        }

        const compositeScore = deficitRatio * 50 + priorityScore * 0.3 + balanceScore;
        return { dept: d, score: compositeScore, deficitRatio, priority: d.priority };
      });

      // Sort descending by composite score
      scoredDepts.sort((a, b) => {
        if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
        return stableHash(a.dept.id + member.id) - stableHash(b.dept.id + member.id);
      });

      chosenDept = scoredDepts[0].dept;
      assignmentReasonCode = "PRIORITY_TIE_BREAKER";
      assignmentReasonDetail = `Resolved among ${availableDepts.length} eligible departments. Selected ${chosenDept.name} based on target deficit and priority (${chosenDept.priority}).`;
    }

    // Step 6: Assign member
    deptAllocatedCount[chosenDept.id] += 1;
    if (member.gender === "MALE") {
      deptGenderCount[chosenDept.id].MALE += 1;
    } else {
      deptGenderCount[chosenDept.id].FEMALE += 1;
    }
    const cat = member.category;
    deptCategoryCount[chosenDept.id][cat] = (deptCategoryCount[chosenDept.id][cat] || 0) + 1;

    assignedMemberIds.add(member.id);

    proposals.push({
      memberId: member.id,
      departmentId: chosenDept.id,
      departmentName: chosenDept.name,
      departmentCode: chosenDept.code,
      reasonCode: assignmentReasonCode,
      reasonDetail: assignmentReasonDetail,
    });
  }

  // Step 7 & 8: Validate proposal and finalize calculations
  for (const dept of departments) {
    const allocated = deptAllocatedCount[dept.id];
    const calc = calculations[dept.id];
    calc.allocatedInProposal = allocated;

    if (calc.maxCapacity - calc.existingCount <= allocated && calc.maxCapacity <= calc.existingCount + allocated) {
      calc.targetStatus = "MAX_CAPACITY_REACHED";
    } else if (allocated >= calc.effectiveCapacityRemaining && calc.effectiveCapacityRemaining > 0) {
      calc.targetStatus = "TARGET_ACHIEVED";
    } else if (calc.eligibleCount === 0) {
      calc.targetStatus = "NO_ELIGIBLE_AVAILABLE";
    } else {
      calc.targetStatus = "PARTIALLY_ACHIEVED";
    }
  }

  return {
    totalUnassignedMembers: members.length,
    departmentCalculations: calculations,
    proposals,
    exceptions,
    summary: {
      totalAllocated: proposals.length,
      totalExceptions: exceptions.length,
      timestamp: new Date().toISOString(),
    },
  };
}

