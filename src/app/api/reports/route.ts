import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId") || user.campusId;

    const campusWhere = campusId ? { campusId } : {};

    // 1. Members count
    const [totalRegistered, activeMembers, inactiveMembers] = await Promise.all([
      db.member.count({ where: campusWhere }),
      db.member.count({ where: { ...campusWhere, status: "ACTIVE" } }),
      db.member.count({ where: { ...campusWhere, status: "INACTIVE" } }),
    ]);

    // 2. Active allocations
    const allocatedMembersCount = await db.memberAllocation.count({
      where: {
        isActive: true,
        member: campusWhere,
      },
    });

    const unallocatedMembersCount = Math.max(0, activeMembers - allocatedMembersCount);

    // 3. Departments metrics
    const departments = await db.department.findMany({
      where: { ...campusWhere, status: "ACTIVE" },
      include: {
        allocations: { where: { isActive: true } },
      },
      orderBy: { name: "asc" },
    });

    const departmentStats = departments.map((d) => {
      const activeCount = d.allocations.length;
      const capacityPercent = d.maxCapacity > 0 ? Math.round((activeCount / d.maxCapacity) * 100) : 0;
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        targetPercent: d.targetPercent,
        maxCapacity: d.maxCapacity,
        activeCount,
        capacityPercent,
        availableSlots: Math.max(0, d.maxCapacity - activeCount),
      };
    });

    // 4. Gender breakdown
    const [maleCount, femaleCount] = await Promise.all([
      db.member.count({ where: { ...campusWhere, gender: "MALE" } }),
      db.member.count({ where: { ...campusWhere, gender: "FEMALE" } }),
    ]);

    // 5. Category breakdown
    const allMembers = await db.member.findMany({
      where: campusWhere,
      select: { category: true, isDeacon: true },
    });

    const categoryMap: Record<string, number> = {};
    let deaconCount = 0;
    for (const m of allMembers) {
      categoryMap[m.category] = (categoryMap[m.category] || 0) + 1;
      if (m.isDeacon) deaconCount++;
    }

    // 6. Transfer count
    const totalTransfers = await db.departmentTransferRequest.count({
      where: { status: "APPROVED" },
    });

    return NextResponse.json({
      summary: {
        totalRegistered,
        activeMembers,
        inactiveMembers,
        allocatedMembersCount,
        unallocatedMembersCount,
        allocationRatePercent: activeMembers > 0 ? Math.round((allocatedMembersCount / activeMembers) * 100) : 0,
        deaconCount,
        totalTransfers,
      },
      departments: departmentStats,
      demographics: {
        gender: {
          male: maleCount,
          female: femaleCount,
          maleRatio: totalRegistered > 0 ? Math.round((maleCount / totalRegistered) * 100) : 0,
          femaleRatio: totalRegistered > 0 ? Math.round((femaleCount / totalRegistered) * 100) : 0,
        },
        categories: categoryMap,
      },
    });
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

