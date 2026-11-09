import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken, getUserPermissions } from "@/lib/auth";
import { RoleType } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { campus: true, department: true },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: "Invalid credentials or inactive account" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const permissions = getUserPermissions(user.role, user.customPerms);

    const sessionPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as RoleType,
      campusId: user.campusId,
      departmentId: user.departmentId,
      permissions,
    };

    const token = signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        campus: user.campus ? { id: user.campus.id, name: user.campus.name, code: user.campus.code } : null,
        department: user.department ? { id: user.department.id, name: user.department.name } : null,
        permissions,
      },
    });

    response.cookies.set({
      name: "c_cimas_session",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

