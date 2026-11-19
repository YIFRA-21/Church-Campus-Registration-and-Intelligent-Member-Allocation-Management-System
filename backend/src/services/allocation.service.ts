import { DepartmentService, DepartmentRecord } from "./department.service";
import { MemberService, MemberRecord } from "./member.service";
import { EligibilityService, MemberEligibilityResult } from "./eligibility.service";
import { calculateLargestRemainderTargets, CalculatedDepartmentTarget } from "../utils/rounding";
import {
  RunAllocationInput,
  ResolveExceptionInput,
} from "../schemas/allocation.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";

export interface AllocationTargetRecord {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  targetPercentage: number;
  targetCount: number;
  allocatedCount: number;
  capacity: number;
}

export interface MemberAllocationRecord {
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

export interface AllocationExceptionRecord {
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

export interface AllocationBatchRecord {
  id: string;
  campusId: string;
  cycleName: string;
  totalMembers: number;
  allocatedCount: number;
  exceptionCount: number;
  status: "DRAFT" | "PREVIEW_READY" | "APPROVED" | "CANCELLED";
  targets: AllocationTargetRecord[];
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export let allocationBatchesStore: AllocationBatchRecord[] = [];
export let memberAllocationsStore: MemberAllocationRecord[] = [];
export let allocationExceptionsStore: AllocationExceptionRecord[] = [];

export class AllocationService {
  /**
   * CORE DETERMINISTIC ALLOCATION ENGINE
   * Implements 100% accounting (Option A) with Largest Remainder Target Deficit Balancing
   */
  static async runAllocation(
    input: RunAllocationInput,
    currentUser: AuthSessionPayload
  ): Promise<AllocationBatchRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can execute intelligent member allocation");
    }

    const { campusId, cycleName } = input;

    // Step A: Active Departments
    const activeDepts = (await DepartmentService.getAll(campusId)).filter((d) => d.isActive);
    if (activeDepts.length === 0) {
      throw new Error("No active departments configured for this campus.");
    }

    // Step B: Target Percentages
    const sumPercent = activeDepts.reduce((acc, d) => acc + d.targetPercentage, 0);
    const roundedSum = Math.round(sumPercent * 100) / 100;
    if (Math.abs(roundedSum - 100) > 0.01) {
      throw new Error(
        `Department targets must sum to exactly 100% before running allocation. Current sum: ${roundedSum}%`
      );
    }

    // Step C: Candidates for Allocation (Active unallocated members of this campus)
    const { members: candidateMembers } = await MemberService.getAll(
      { campusId, status: "ACTIVE", limit: 50000 },
      currentUser
    );

    const unassignedMembers = candidateMembers.filter((m) => !m.currentDepartmentId);

    if (unassignedMembers.length === 0) {
      throw new Error(
        "No unassigned active members found on this campus for allocation. Please import or register members first."
      );
    }

    const totalCandidateCount = unassignedMembers.length;

    // Step D: Calculate Target Counts (Largest Remainder Method)
    const shareInputs = activeDepts.map((d) => ({
      departmentId: d.id,
      departmentCode: d.code,
      departmentName: d.name,
      percentage: d.targetPercentage,
    }));

    const calculatedTargetsResult = calculateLargestRemainderTargets(
      totalCandidateCount,
      shareInputs
    );

    // Initialize allocation targets tracker
    const targetsTracker: Record<
      string,
      {
        department: DepartmentRecord;
        targetCount: number;
        allocatedCount: number;
        targetPercentage: number;
      }
    > = {};

    calculatedTargetsResult.targets.forEach((t) => {
      const dept = activeDepts.find((d) => d.id === t.departmentId)!;
      targetsTracker[t.departmentId] = {
        department: dept,
        targetCount: t.targetCount,
        allocatedCount: 0,
        targetPercentage: t.percentage,
      };
    });

    const batchId = `ab000000-0000-0000-0000-${(allocationBatchesStore.length + 1).toString().padStart(12, "0")}`;

    const newAllocations: MemberAllocationRecord[] = [];
    const newExceptions: AllocationExceptionRecord[] = [];

    // Step E: Pre-evaluate Eligibility
    interface MemberEvaluated {
      member: MemberRecord;
      eligibleDepts: DepartmentRecord[];
      eligibilityResult: MemberEligibilityResult;
    }

    const evaluatedMembers: MemberEvaluated[] = unassignedMembers.map((m) => {
      const res = EligibilityService.evaluateAll(m, activeDepts);
      return {
        member: m,
        eligibleDepts: res.eligibleDepartments,
        eligibilityResult: res,
      };
    });

    // Step F: Segregate Ineligible members -> Exceptions Queue
    const candidatesWithChoices: MemberEvaluated[] = [];
    for (const item of evaluatedMembers) {
      if (item.eligibleDepts.length === 0) {
        // Collect detailed explanation of why ineligible
        const reasonsSummary = item.eligibilityResult.ineligibleDetails
          .map((d) => `${d.departmentCode}: ${d.reasons.join("; ")}`)
          .join(" | ");

        newExceptions.push({
          id: `ex000000-0000-0000-0000-${(allocationExceptionsStore.length + newExceptions.length + 1).toString().padStart(12, "0")}`,
          batchId,
          memberId: item.member.id,
          memberCode: item.member.memberId,
          memberName: item.member.fullName,
          gender: item.member.gender,
          campusId,
          exceptionType: "NO_ELIGIBLE_DEPARTMENT",
          reason: `Member is not eligible for any active department: ${reasonsSummary || "Strict criteria not met"}`,
          eligibleDepartments: [],
          resolutionStatus: "PENDING",
          createdAt: new Date().toISOString(),
        });
      } else {
        candidatesWithChoices.push(item);
      }
    }

    // Step G: Deterministic Sorting:
    // Prioritize members with fewest eligible choices first (most constrained),
    // then tie-break by memberId alphabetically.
    candidatesWithChoices.sort((a, b) => {
      if (a.eligibleDepts.length !== b.eligibleDepts.length) {
        return a.eligibleDepts.length - b.eligibleDepts.length;
      }
      return a.member.memberId.localeCompare(b.member.memberId);
    });

    // Step H: Assign members based on Target Deficit & Capacity
    for (const item of candidatesWithChoices) {
      const { member, eligibleDepts } = item;

      // Filter eligible departments that have not exceeded fixed max capacity
      const capacityAvailableDepts = eligibleDepts.filter((dept) => {
        const tracker = targetsTracker[dept.id];
        return tracker.allocatedCount < dept.capacity;
      });

      if (capacityAvailableDepts.length === 0) {
        // All eligible departments are full -> Exception Queue
        newExceptions.push({
          id: `ex000000-0000-0000-0000-${(allocationExceptionsStore.length + newExceptions.length + 1).toString().padStart(12, "0")}`,
          batchId,
          memberId: member.id,
          memberCode: member.memberId,
          memberName: member.fullName,
          gender: member.gender,
          campusId,
          exceptionType: "CAPACITY_EXCEEDED",
          reason: `All eligible departments (${eligibleDepts.map((d) => d.code).join(", ")}) have reached capacity limit.`,
          eligibleDepartments: eligibleDepts.map((d) => ({
            id: d.id,
            code: d.code,
            name: d.name,
          })),
          resolutionStatus: "PENDING",
          createdAt: new Date().toISOString(),
        });
        continue;
      }

      // Rank available departments by target deficit: (T_d - A_d) / T_d descending
      capacityAvailableDepts.sort((a, b) => {
        const trA = targetsTracker[a.id];
        const trB = targetsTracker[b.id];

        const deficitA = trA.targetCount > 0 ? (trA.targetCount - trA.allocatedCount) / trA.targetCount : -1;
        const deficitB = trB.targetCount > 0 ? (trB.targetCount - trB.allocatedCount) / trB.targetCount : -1;

        if (Math.abs(deficitB - deficitA) > 0.00001) {
          return deficitB - deficitA; // Largest deficit first
        }

        // Tie-breaker 1: Priority rank ascending
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        // Tie-breaker 2: Stable department code
        return a.code.localeCompare(b.code);
      });

      // Best department selected
      const chosenDept = capacityAvailableDepts[0];
      targetsTracker[chosenDept.id].allocatedCount++;

      newAllocations.push({
        id: `ma000000-0000-0000-0000-${(memberAllocationsStore.length + newAllocations.length + 1).toString().padStart(12, "0")}`,
        batchId,
        memberId: member.id,
        memberCode: member.memberId,
        memberName: member.fullName,
        gender: member.gender,
        departmentId: chosenDept.id,
        departmentCode: chosenDept.code,
        departmentName: chosenDept.name,
        allocationStatus: "PROPOSED",
        allocationMethod: "AUTOMATIC",
        reasonCode: `TARGET_DEFICIT_OPTIMIZED (Choice 1 of ${eligibleDepts.length} eligible)`,
        createdAt: new Date().toISOString(),
      });
    }

    // Step I: Build Batch Record & Commit Proposed State
    const batchTargets: AllocationTargetRecord[] = Object.values(targetsTracker).map((tr) => ({
      departmentId: tr.department.id,
      departmentCode: tr.department.code,
      departmentName: tr.department.name,
      targetPercentage: tr.targetPercentage,
      targetCount: tr.targetCount,
      allocatedCount: tr.allocatedCount,
      capacity: tr.department.capacity,
    }));

    const batchRecord: AllocationBatchRecord = {
      id: batchId,
      campusId,
      cycleName,
      totalMembers: totalCandidateCount,
      allocatedCount: newAllocations.length,
      exceptionCount: newExceptions.length,
      status: "PREVIEW_READY",
      targets: batchTargets,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allocationBatchesStore.unshift(batchRecord);
    memberAllocationsStore.push(...newAllocations);
    allocationExceptionsStore.push(...newExceptions);

    return batchRecord;
  }

  static async getBatches(campusId?: string): Promise<AllocationBatchRecord[]> {
    if (campusId) {
      return allocationBatchesStore.filter((b) => b.campusId === campusId);
    }
    return allocationBatchesStore;
  }

  static async getBatchById(batchId: string): Promise<AllocationBatchRecord | null> {
    const found = allocationBatchesStore.find((b) => b.id === batchId);
    return found || null;
  }

  static async getAllocationsForBatch(batchId: string): Promise<MemberAllocationRecord[]> {
    return memberAllocationsStore.filter((a) => a.batchId === batchId);
  }

  static async getExceptionsForBatch(
    batchId: string,
    status?: "PENDING" | "RESOLVED" | "ON_HOLD"
  ): Promise<AllocationExceptionRecord[]> {
    let list = allocationExceptionsStore.filter((e) => e.batchId === batchId);
    if (status) {
      list = list.filter((e) => e.resolutionStatus === status);
    }
    return list;
  }

  /**
   * Resolve an allocation exception individually with documented reason
   */
  static async resolveException(
    exceptionId: string,
    input: ResolveExceptionInput,
    currentUser: AuthSessionPayload
  ): Promise<AllocationExceptionRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can resolve allocation exceptions");
    }

    const exIndex = allocationExceptionsStore.findIndex((e) => e.id === exceptionId);
    if (exIndex === -1) {
      throw new Error("Allocation exception record not found");
    }

    const exception = allocationExceptionsStore[exIndex];
    const batch = allocationBatchesStore.find((b) => b.id === exception.batchId);
    if (!batch) {
      throw new Error("Associated allocation batch not found");
    }

    if (batch.status === "APPROVED") {
      throw new Error("Cannot alter exceptions on an already approved allocation batch");
    }

    if (input.action === "HOLD") {
      exception.resolutionStatus = "ON_HOLD";
      exception.resolvedBy = currentUser.fullName;
      exception.resolutionReason = `Placed on administrative hold: ${input.justification}`;
      exception.resolvedAt = new Date().toISOString();
      return exception;
    }

    if (!input.departmentId) {
      throw new Error("Target department must be specified for ASSIGN or OVERRIDE actions");
    }

    const dept = await DepartmentService.getById(input.departmentId);
    if (!dept) {
      throw new Error("Target department not found");
    }

    // Create or update member allocation
    const existingAllocation = memberAllocationsStore.find(
      (a) => a.batchId === exception.batchId && a.memberId === exception.memberId
    );

    if (existingAllocation) {
      existingAllocation.departmentId = dept.id;
      existingAllocation.departmentCode = dept.code;
      existingAllocation.departmentName = dept.name;
      existingAllocation.allocationMethod = "MANUAL_OVERRIDE";
      existingAllocation.overrideReason = input.justification;
    } else {
      memberAllocationsStore.push({
        id: `ma000000-0000-0000-0000-${(memberAllocationsStore.length + 1).toString().padStart(12, "0")}`,
        batchId: exception.batchId,
        memberId: exception.memberId,
        memberCode: exception.memberCode,
        memberName: exception.memberName,
        gender: exception.gender,
        departmentId: dept.id,
        departmentCode: dept.code,
        departmentName: dept.name,
        allocationStatus: "PROPOSED",
        allocationMethod: "MANUAL_OVERRIDE",
        reasonCode: input.action === "OVERRIDE" ? "ADMIN_OVERRIDE_APPROVED" : "ADMIN_MANUAL_ASSIGNMENT",
        overrideReason: input.justification,
        createdAt: new Date().toISOString(),
      });
      batch.allocatedCount++;
    }

    // Update target allocation counter on batch
    const targetObj = batch.targets.find((t) => t.departmentId === dept.id);
    if (targetObj) {
      targetObj.allocatedCount++;
    }

    exception.resolutionStatus = "RESOLVED";
    exception.resolvedDepartmentId = dept.id;
    exception.resolvedDepartmentName = dept.name;
    exception.resolvedBy = currentUser.fullName;
    exception.resolutionReason = `${input.action === "OVERRIDE" ? "Authorized override" : "Manual assignment"}: ${input.justification}`;
    exception.resolvedAt = new Date().toISOString();

    batch.updatedAt = new Date().toISOString();
    return exception;
  }

  /**
   * Final Allocation Approval Workflow
   * Enforces Rule 13: Unresolved exceptions block approval!
   */
  static async approveBatch(
    batchId: string,
    currentUser: AuthSessionPayload
  ): Promise<AllocationBatchRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can approve final member allocations");
    }

    const batch = allocationBatchesStore.find((b) => b.id === batchId);
    if (!batch) {
      throw new Error("Allocation batch not found");
    }

    if (batch.status === "APPROVED") {
      throw new Error("Allocation batch is already approved.");
    }

    // Rule 13: Check for pending unresolved exceptions
    const pendingExceptions = allocationExceptionsStore.filter(
      (e) => e.batchId === batchId && e.resolutionStatus === "PENDING"
    );

    if (pendingExceptions.length > 0) {
      throw new Error(
        `Cannot approve allocation batch: There are ${pendingExceptions.length} unresolved exceptions in the Admin review queue. All exceptions must be resolved or placed on hold before final approval.`
      );
    }

    // Commit proposed allocations to active member records
    const batchAllocations = memberAllocationsStore.filter((a) => a.batchId === batchId);
    for (const alloc of batchAllocations) {
      alloc.allocationStatus = "COMMITTED";
      // Update member's active department assignment
      await MemberService.update(
        alloc.memberId,
        { currentDepartmentId: alloc.departmentId },
        currentUser
      );
    }

    // Update department active count
    for (const t of batch.targets) {
      const dept = await DepartmentService.getById(t.departmentId);
      if (dept) {
        dept.allocatedMembersCount += t.allocatedCount;
      }
    }

    batch.status = "APPROVED";
    batch.approvedBy = currentUser.fullName;
    batch.approvedAt = new Date().toISOString();
    batch.updatedAt = new Date().toISOString();

    return batch;
  }
}
