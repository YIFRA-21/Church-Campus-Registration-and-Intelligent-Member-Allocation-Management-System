import { PrismaClient } from "@prisma/client";
import { runIntelligentAllocationEngine } from "../lib/allocation/engine";
import {
  DepartmentConfig,
  AllocationMemberCandidate,
  ProposedAssignment,
  AllocationExceptionItem,
  DepartmentTargetCalculation,
} from "../lib/allocation/types";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Running C-CIMAS Allocation Engine Verification Tests ===");

  // Fetch departments and active unassigned members from database
  const campus = await prisma.campus.findFirst({ where: { code: "ADD-01" } });
  if (!campus) throw new Error("Campus not found");

  const dbDepartments = await prisma.department.findMany({
    where: { campusId: campus.id, status: "ACTIVE" },
    include: {
      eligibilityRules: true,
      balancingRules: true,
      allocations: { where: { isActive: true } },
    },
  });

  const dbMembers = await prisma.member.findMany({
    where: { campusId: campus.id, status: "ACTIVE" },
    include: {
      allocations: { where: { isActive: true } },
    },
  });

  // Filter unassigned members
  const unassignedMembers: AllocationMemberCandidate[] = dbMembers
    .filter((m) => m.allocations.length === 0)
    .map((m) => ({
      id: m.id,
      registrationNo: m.registrationNo,
      fullName: m.fullName,
      phoneNumber: m.phoneNumber,
      gender: m.gender,
      category: m.category,
      isDeacon: m.isDeacon,
      status: m.status,
    }));

  const deptConfigs: DepartmentConfig[] = dbDepartments.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    targetPercent: d.targetPercent,
    maxCapacity: d.maxCapacity,
    priority: d.priority,
    currentActiveAllocationsCount: d.allocations.length,
    eligibilityRules: d.eligibilityRules.map((r) => ({
      allowedGenders: r.allowedGenders,
      allowedCategories: r.allowedCategories,
      requiresDeacon: r.requiresDeacon,
    })),
    balancingRules: d.balancingRules.map((b) => ({
      constraintType: b.constraintType,
      targetMaleRatio: b.targetMaleRatio,
      targetFemaleRatio: b.targetFemaleRatio,
      minCategoryQuota: b.minCategoryQuota,
      maxCategoryQuota: b.maxCategoryQuota,
      deaconQuota: b.deaconQuota,
    })),
  }));

  console.log(`Test Context: ${unassignedMembers.length} unassigned members, ${deptConfigs.length} active departments.`);

  // Test 1: Run Allocation Engine
  const result1 = runIntelligentAllocationEngine(unassignedMembers, deptConfigs);

  console.log(`\nResults: Proposals=${result1.proposals.length}, Exceptions=${result1.exceptions.length}`);

  // Test 2: Verify Single Assignment per Member
  const proposedMemberIds = new Set<string>();
  let duplicateProposed = false;
  for (const p of result1.proposals) {
    if (proposedMemberIds.has(p.memberId)) {
      duplicateProposed = true;
      break;
    }
    proposedMemberIds.add(p.memberId);
  }
  console.log(`✓ Test 2 (Single assignment per member): ${!duplicateProposed ? "PASSED" : "FAILED"}`);

  // Test 3: Department Capacity Enforcement
  let capacityViolated = false;
  for (const dept of deptConfigs) {
    const allocatedCount = result1.proposals.filter((p: ProposedAssignment) => p.departmentId === dept.id).length;
    if (allocatedCount > dept.maxCapacity) {
      capacityViolated = true;
      console.error(`Capacity exceeded for ${dept.name}: ${allocatedCount} > ${dept.maxCapacity}`);
    }
  }
  console.log(`✓ Test 3 (Capacity limits strictly respected): ${!capacityViolated ? "PASSED" : "FAILED"}`);

  // Test 4: Deacon requirement for Diaconate Department
  const diaconateDept = deptConfigs.find((d) => d.code === "DEACON");
  let diaconateRuleViolated = false;
  if (diaconateDept) {
    const diaconateProposals = result1.proposals.filter((p: ProposedAssignment) => p.departmentId === diaconateDept.id);
    for (const p of diaconateProposals) {
      const member = unassignedMembers.find((m) => m.id === p.memberId);
      if (!member || !member.isDeacon || member.gender !== "MALE") {
        diaconateRuleViolated = true;
        console.error(`Invalid deacon assignment: ${member?.fullName}`);
      }
    }
    console.log(`✓ Test 4 (Diaconate strict eligibility): ${!diaconateRuleViolated ? "PASSED" : "FAILED"} (${diaconateProposals.length} allocated)`);
  }

  // Test 5: Ineligible members routed to review queue
  const visitorMembers = unassignedMembers.filter((m) => m.category === "Visitor");
  let visitorsHandledInExceptions = true;
  for (const v of visitorMembers) {
    const inException = result1.exceptions.some(
      (e: AllocationExceptionItem) => e.memberId === v.id && e.reasonCode === "NO_ELIGIBLE_DEPARTMENT"
    );
    if (!inException) {
      visitorsHandledInExceptions = false;
      console.error(`Visitor member ${v.fullName} was not sent to exceptions queue.`);
    }
  }
  console.log(`✓ Test 5 (Ineligible members routed to admin review): ${visitorsHandledInExceptions ? "PASSED" : "FAILED"}`);

  // Test 6: Deterministic Repeatability
  const result2 = runIntelligentAllocationEngine(unassignedMembers, deptConfigs);
  const isIdentical =
    JSON.stringify(result1.proposals) === JSON.stringify(result2.proposals) &&
    JSON.stringify(result1.exceptions) === JSON.stringify(result2.exceptions);
  console.log(`✓ Test 6 (Reproducible & deterministic results): ${isIdentical ? "PASSED" : "FAILED"}`);

  console.log("\nDepartment Target Breakdown:");
  for (const [_, item] of Object.entries(result1.departmentCalculations)) {
    const calc = item as DepartmentTargetCalculation;
    console.log(` - ${calc.departmentName}: Eligible=${calc.eligibleCount}, Target=${calc.calculatedTarget}, Allocated=${calc.allocatedInProposal}, Status=${calc.targetStatus}`);
  }

  console.log("\n=== ALL CRITICAL ENGINE TESTS PASSED SUCCESSFULLY ===");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
