import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/types";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campuses = await db.campus.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { members: true, departments: true },
        },
      },
    });

    return NextResponse.json({ campuses });
  } catch (error) {
    console.error("GET campuses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, PERMISSIONS.CAMPUS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden: Requires campus.manage permission" }, { status: 403 });
    }

    const { code, name, city } = await request.json();
    if (!code || !name || !city) {
      return NextResponse.json({ error: "Code, name, and city are required." }, { status: 400 });
    }

    const existing = await db.campus.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: `Campus code "${code}" already exists.` }, { status: 400 });
    }

    const campus = await db.campus.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        city: city.trim(),
      },
    });

    await logAudit({
      userId: user.id,
      campusId: campus.id,
      action: "CAMPUS_CREATED",
      entityType: "Campus",
      entityId: campus.id,
      newValues: { code: campus.code, name: campus.name, city: campus.city },
    });

    return NextResponse.json({ success: true, campus }, { status: 201 });
  } catch (error) {
    console.error("POST campus error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

