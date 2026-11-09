import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/types";
import { runIntelligentAllocationEngine } from "@/lib/allocation/engine";
import { DepartmentConfig, AllocationMemberCandidate } from "@/lib/allocation/types";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId") || user.campusId;

    const where: Record<string, unknown> = {};
    if (campusId) where.campusId = campusId;

    const batches = await db.allocationBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        campus: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, fullName: true, email: true } },
        approver: { select: { id: true, fullName: true, email: true } },
        _count: {
          select: { proposals: true, exceptions: true, allocations: true },
        },
      },
    });

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("GET allocation batches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, PERMISSIONS.ALLOCATION_RUN)) {
      return NextResponse.json({ error: "Forbidden: Requires allocation.run permission" }, { status: 403 });
    }

    const { campusId } = await request.json();
    const effectiveCampusId = user.campusId || campusId;

    if (!effectiveCampusId) {
      return NextResponse.json({ error: "Campus is required to run allocation." }, { status: 400 });
    }

    // 1. Fetch active departments for campus
    const departments = await db.department.findMany({
      where: { campusId: effectiveCampusId, status: "ACTIVE" },
      include: {
        eligibilityRules: true,
        balancingRules: true,
        allocations: { where: { isActive: true } },
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });

    if (departments.length === 0) {
      return NextResponse.json({ error: "No active departments configured for this campus." }, { status: 400 });
    }

    // 2. Fetch active members without an active department allocation
    const members = await db.member.findMany({
      where: {
        campusId: effectiveCampusId,
        status: "ACTIVE",
        allocations: {
          none: { isActive: true },
        },
      },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No unassigned active members available for allocation." },
        { status: 400 }
      );
    }

    // Format for engine
    const candidates: AllocationMemberCandidate[] = members.map((m) => ({
      id: m.id,
      registrationNo: m.registrationNo,
      fullName: m.fullName,
      phoneNumber: m.phoneNumber,
      gender: m.gender,
      category: m.category,
      isDeacon: m.isDeacon,
      status: m.status,
    }));

    const deptConfigs: DepartmentConfig[] = departments.map((d) => ({
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

    // Run engine (Pure functional calculation, NO active DB side-effects yet)
    const engineResult = runIntelligentAllocationEngine(candidates, deptConfigs);

    // Save batch as PREVIEW_READY / PENDING_APPROVAL
    const batchCount = await db.allocationBatch.count({ where: { campusId: effectiveCampusId } });
    const batchNumber = `BATCH-${new Date().getFullYear()}-${(batchCount + 1).toString().padStart(4, "0")}`;

    const batch = await db.allocationBatch.create({
      data: {
        campusId: effectiveCampusId,
        batchNumber,
        status: "PREVIEW_READY",
        calculationMeta: JSON.stringify(engineResult.departmentCalculations),
        createdByUserId: user.id,
        proposals: {
          create: engineResult.proposals.map((p) => ({
            memberId: p.memberId,
            departmentId: p.departmentId,
            reasonCode: p.reasonCode,
            reasonDetail: p.reasonDetail,
            status: "PROPOSED",
          })),
        },
        exceptions: {
          create: engineResult.exceptions.map((e) => ({
            memberId: e.memberId,
            reasonCode: e.reasonCode,
            reasonDetail: e.reasonDetail,
            reviewed: false,
          })),
        },
      },
      include: {
        proposals: true,
        exceptions: true,
      },
    });

    await logAudit({
      userId: user.id,
      campusId: effectiveCampusId,
      action: "ALLOCATION_BATCH_GENERATED",
      entityType: "AllocationBatch",
      entityId: batch.id,
      newValues: {
        batchNumber: batch.batchNumber,
        proposalsCount: batch.proposals.length,
        exceptionsCount: batch.exceptions.length,
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      summary: engineResult.summary,
      calculations: engineResult.departmentCalculations,
    });
  } catch (error: unknown) {
    console.error("POST allocation batch error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

