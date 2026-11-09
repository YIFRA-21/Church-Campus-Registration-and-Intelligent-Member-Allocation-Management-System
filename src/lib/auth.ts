import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ROLE_DEFAULT_PERMISSIONS, RoleType, SessionUser, PermissionCode } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "c_cimas_secure_jwt_secret_key_2026_dev_env";
const AUTH_COOKIE = "c_cimas_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getUserPermissions(role: string, customPermsJson?: string | null): string[] {
  const defaultPerms = ROLE_DEFAULT_PERMISSIONS[role as RoleType] || [];
  if (!customPermsJson) return defaultPerms;
  try {
    const custom: string[] = JSON.parse(customPermsJson);
    return Array.from(new Set([...defaultPerms, ...custom]));
  } catch {
    return defaultPerms;
  }
}

export function hasPermission(user: SessionUser | null, permission: PermissionCode): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return user.permissions.includes(permission);
}

export function assertPermission(user: SessionUser | null, permission: PermissionCode) {
  if (!hasPermission(user, permission)) {
    throw new Error(`Unauthorized: Missing required permission ${permission}`);
  }
}

