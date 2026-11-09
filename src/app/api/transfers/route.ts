import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/types";
import { logAudit } from "@/lib/audit";
import { isMemberEligibleForDepartment } from "@/lib/allocation/eligibility";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;

    const transfers = await db.departmentTransferRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { id: true, registrationNo: true, fullName: true, phoneNumber: true, gender: true, category: true, isDeacon: true } },
        fromDept: { select: { id: true, name: true, code: true } },
        toDept: { select: { id: true, name: true, code: true, maxCapacity: true } },
        requester: { select: { id: true, fullName: true, email: true } },
        approver: { select: { id: true, fullName: true, email: true } },
      },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("GET transfers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, PERMISSIONS.MEMBER_REASSIGN)) {
      return NextResponse.json({ error: "Forbidden: Requires member.reassign permission" }, { status: 403 });
    }

    const { memberId, toDepartmentId, reason } = await request.json();

    if (!memberId || !toDepartmentId || !reason) {
      return NextResponse.json({ error: "Member, destination department, and reason are required." }, { status: 400 });
    }

    // 1. Fetch member and their current active allocation
    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        allocations: {
          where: { isActive: true },
          include: { department: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const currentAllocation = member.allocations[0];
    if (!currentAllocation) {
      return NextResponse.json(
        { error: "Member currently has no active department allocation to reassign from." },
        { status: 400 }
      );
    }

    if (currentAllocation.departmentId === toDepartmentId) {
      return NextResponse.json(
        { error: "Destination department is the same as the member's current department." },
        { status: 400 }
      );
    }

    // 2. Fetch destination department and verify capacity & eligibility
    const destDept = await db.department.findUnique({
      where: { id: toDepartmentId },
      include: {
        eligibilityRules: true,
        balancingRules: true,
        allocations: { where: { isActive: true } },
      },
    });

    if (!destDept || destDept.status !== "ACTIVE") {
      return NextResponse.json({ error: "Destination department is invalid or inactive." }, { status: 400 });
    }

    // Capacity Check
    if (destDept.allocations.length >= destDept.maxCapacity) {
      return NextResponse.json(
        { error: `Destination department "${destDept.name}" has reached its maximum fixed capacity (${destDept.maxCapacity}).` },
        { status: 400 }
      );
    }

    // Eligibility Check
    const candidateFormat = {
      id: member.id,
      registrationNo: member.registrationNo,
      fullName: member.fullName,
      phoneNumber: member.phoneNumber,
      gender: member.gender,
      category: member.category,
      isDeacon: member.isDeacon,
      status: member.status,
    };

    const deptConfigFormat = {
      id: destDept.id,
      name: destDept.name,
      code: destDept.code,
      targetPercent: destDept.targetPercent,
      maxCapacity: destDept.maxCapacity,
      priority: destDept.priority,
      currentActiveAllocationsCount: destDept.allocations.length,
      eligibilityRules: destDept.eligibilityRules.map((r) => ({
        allowedGenders: r.allowedGenders,
        allowedCategories: r.allowedCategories,
        requiresDeacon: r.requiresDeacon,
      })),
      balancingRules: destDept.balancingRules.map((b) => ({
        constraintType: b.constraintType,
        targetMaleRatio: b.targetMaleRatio,
        targetFemaleRatio: b.targetFemaleRatio,
        minCategoryQuota: b.minCategoryQuota,
        maxCategoryQuota: b.maxCategoryQuota,
        deaconQuota: b.deaconQuota,
      })),
    };

    const eligibilityCheck = isMemberEligibleForDepartment(candidateFormat, deptConfigFormat);
    if (!eligibilityCheck.eligible) {
      // Check if user has exception permission
      const canOverride = hasPermission(user, PERMISSIONS.MEMBER_ASSIGN_EXCEPTION);
      if (!canOverride) {
        return NextResponse.json(
          {
            error: `Member is not eligible for "${destDept.name}": ${eligibilityCheck.failureReason}. Requires member.assign_exception capability to override.`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Atomically execute transfer inside $transaction
    const transferRecord = await db.$transaction(async (tx) => {
      // Deactivate old allocation
      await tx.memberAllocation.update({
        where: { id: currentAllocation.id },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      });

      // Create new active allocation
      await tx.memberAllocation.create({
        data: {
          memberId: member.id,
          departmentId: destDept.id,
          isActive: true,
          assignedBy: user.id,
          reason: `TRANSFER: ${reason}`,
        },
      });

      // Create transfer history record
      return await tx.departmentTransferRequest.create({
        data: {
          memberId: member.id,
          fromDeptId: currentAllocation.departmentId,
          toDeptId: destDept.id,
          requestedBy: user.id,
          approvedBy: user.id,
          status: "APPROVED",
          reason,
          resolvedAt: new Date(),
        },
        include: {
          fromDept: true,
          toDept: true,
          member: true,
        },
      });
    });

    await logAudit({
      userId: user.id,
      campusId: member.campusId,
      action: "MEMBER_REASSIGNED",
      entityType: "MemberAllocation",
      entityId: transferRecord.id,
      oldValues: { departmentId: currentAllocation.departmentId, departmentName: currentAllocation.department.name },
      newValues: { departmentId: destDept.id, departmentName: destDept.name },
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${member.fullName} from ${currentAllocation.department.name} to ${destDept.name}.`,
      transfer: transferRecord,
    });
  } catch (error: unknown) {
    console.error("POST transfer error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

