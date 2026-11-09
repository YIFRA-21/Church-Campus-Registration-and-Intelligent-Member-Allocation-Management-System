import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: { campus: true, department: true },
  });

  if (!user || !user.active) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      campus: user.campus ? { id: user.campus.id, name: user.campus.name, code: user.campus.code } : null,
      department: user.department ? { id: user.department.id, name: user.department.name } : null,
      permissions: session.permissions,
    },
  });
}

