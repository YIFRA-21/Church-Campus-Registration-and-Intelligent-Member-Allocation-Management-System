import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/types";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId") || user.campusId;

    const whereClause: Record<string, unknown> = {};
    if (campusId) {
      whereClause.campusId = campusId;
    }

    // If Department Manager, only view their own department
    if (user.role === "DEPT_MANAGER" && user.departmentId) {
      whereClause.id = user.departmentId;
    }

    const departments = await db.department.findMany({
      where: whereClause,
      include: {
        campus: { select: { id: true, name: true, code: true } },
        eligibilityRules: true,
        balancingRules: true,
        allocations: {
          where: { isActive: true },
          select: { id: true, memberId: true },
        },
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });

    const enriched = departments.map((d) => ({
      ...d,
      currentActiveAllocationsCount: d.allocations.length,
      capacityUtilizationPercent: d.maxCapacity > 0 ? Math.round((d.allocations.length / d.maxCapacity) * 100) : 0,
    }));

    return NextResponse.json({ departments: enriched });
  } catch (error) {
    console.error("GET departments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, PERMISSIONS.DEPARTMENT_MANAGE)) {
      return NextResponse.json({ error: "Forbidden: Requires department.manage permission" }, { status: 403 });
    }

    const body = await request.json();
    const {
      campusId,
      name,
      code,
      description,
      targetPercent,
      maxCapacity,
      priority,
      allowedGenders = "ALL",
      allowedCategories = "ALL",
      requiresDeacon = null,
      targetMaleRatio = null,
      targetFemaleRatio = null,
    } = body;

    const effectiveCampusId = user.campusId || campusId;
    if (!effectiveCampusId || !name || !code) {
      return NextResponse.json({ error: "Campus, name, and code are required." }, { status: 400 });
    }

    const existing = await db.department.findUnique({
      where: {
        campusId_code: {
          campusId: effectiveCampusId,
          code: code.toUpperCase().trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: `Department code "${code}" already exists in this campus.` }, { status: 400 });
    }

    const department = await db.department.create({
      data: {
        campusId: effectiveCampusId,
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description: description?.trim() || null,
        targetPercent: Number(targetPercent) || 0.2,
        maxCapacity: Number(maxCapacity) || 50,
        priority: Number(priority) || 1,
        status: "ACTIVE",
        eligibilityRules: {
          create: {
            allowedGenders,
            allowedCategories: typeof allowedCategories === "string" ? allowedCategories : JSON.stringify(allowedCategories),
            requiresDeacon,
          },
        },
        balancingRules: {
          create: {
            constraintType: "SOFT",
            targetMaleRatio: targetMaleRatio ? Number(targetMaleRatio) : null,
            targetFemaleRatio: targetFemaleRatio ? Number(targetFemaleRatio) : null,
          },
        },
      },
      include: {
        eligibilityRules: true,
        balancingRules: true,
      },
    });

    await logAudit({
      userId: user.id,
      campusId: effectiveCampusId,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: department.id,
      newValues: { name: department.name, code: department.code, maxCapacity: department.maxCapacity },
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error) {
    console.error("POST department error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

