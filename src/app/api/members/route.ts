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
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search")?.trim() || "";
    const gender = searchParams.get("gender");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const allocationFilter = searchParams.get("allocationFilter"); // "ALLOCATED", "UNALLOCATED", "ALL"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (campusId) {
      where.campusId = campusId;
    }

    // Role-based restrictions: Department Manager can only see their department
    if (user.role === "DEPT_MANAGER" && user.departmentId) {
      where.allocations = {
        some: {
          departmentId: user.departmentId,
          isActive: true,
        },
      };
    } else if (departmentId) {
      where.allocations = {
        some: {
          departmentId,
          isActive: true,
        },
      };
    }

    if (gender && gender !== "ALL") {
      where.gender = gender;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (allocationFilter === "ALLOCATED") {
      where.allocations = { some: { isActive: true } };
    } else if (allocationFilter === "UNALLOCATED") {
      where.allocations = { none: { isActive: true } };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phoneNumber: { contains: search } },
        { registrationNo: { contains: search } },
      ];
    }

    const [total, members] = await Promise.all([
      db.member.count({ where }),
      db.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          campus: { select: { id: true, name: true, code: true } },
          allocations: {
            where: { isActive: true },
            include: {
              department: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
    ]);

    const enriched = members.map((m) => {
      const activeAlloc = m.allocations[0];
      return {
        id: m.id,
        registrationNo: m.registrationNo,
        fullName: m.fullName,
        phoneNumber: m.phoneNumber,
        gender: m.gender,
        category: m.category,
        isDeacon: m.isDeacon,
        status: m.status,
        campus: m.campus,
        currentDepartment: activeAlloc ? activeAlloc.department : null,
        allocatedAt: activeAlloc ? activeAlloc.assignedAt : null,
        allocationReason: activeAlloc ? activeAlloc.reason : null,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      members: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, PERMISSIONS.MEMBER_REGISTER)) {
      return NextResponse.json({ error: "Forbidden: Requires member.register permission" }, { status: 403 });
    }

    const body = await request.json();
    const {
      campusId,
      fullName,
      phoneNumber,
      gender,
      category,
      isDeacon = false,
      notes,
    } = body;

    const effectiveCampusId = user.campusId || campusId;
    if (!effectiveCampusId || !fullName || !phoneNumber || !gender || !category) {
      return NextResponse.json({ error: "Campus, full name, phone number, gender, and category are required." }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");

    // Check duplicate phone in same campus
    const duplicate = await db.member.findFirst({
      where: {
        campusId: effectiveCampusId,
        phoneNumber: { contains: cleanPhone },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: `A member with phone number "${phoneNumber}" already exists (${duplicate.fullName}).` },
        { status: 409 }
      );
    }

    // Auto-generate Registration Number
    const count = await db.member.count({ where: { campusId: effectiveCampusId } });
    const regNo = `REG-${(count + 1).toString().padStart(5, "0")}`;

    const member = await db.member.create({
      data: {
        campusId: effectiveCampusId,
        registrationNo: regNo,
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        gender: gender.toUpperCase(),
        category,
        isDeacon: Boolean(isDeacon),
        notes: notes?.trim() || null,
        status: "ACTIVE",
      },
      include: { campus: true },
    });

    await logAudit({
      userId: user.id,
      campusId: effectiveCampusId,
      action: "MEMBER_REGISTERED",
      entityType: "Member",
      entityId: member.id,
      newValues: { registrationNo: member.registrationNo, fullName: member.fullName, phone: member.phoneNumber },
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    console.error("POST member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

