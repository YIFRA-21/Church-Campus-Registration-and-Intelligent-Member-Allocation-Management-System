import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_SECRET } from "../config/supabase";
import { LoginInput, AuthSessionPayload } from "../schemas/auth.schema";

// Pre-seeded accounts matching all 6 roles from BRS for instant testing & development
const DEMO_USERS: Record<
  string,
  {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    campusId: string | null;
    campusName: string | null;
    role: string;
    permissions: string[];
  }
> = {
  "admin@c-cimas.org": {
    id: "u0000000-0000-0000-0000-000000000001",
    email: "admin@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Rev. Solomon Tadesse",
    campusId: null,
    campusName: "Global Oversight (All Campuses)",
    role: "SUPER_ADMIN",
    permissions: [
      "campus.manage",
      "campus.view",
      "user.manage",
      "department.manage",
      "department.view",
      "member.register",
      "member.import_excel",
      "member.view_all",
      "member.view_dept",
      "allocation.configure",
      "allocation.run",
      "allocation.approve",
      "member.reassign",
      "member.assign_exception",
      "reports.view",
      "export.excel",
      "audit.view",
      "settings.manage",
    ],
  },
  "campusadmin@c-cimas.org": {
    id: "u0000000-0000-0000-0000-000000000002",
    email: "campusadmin@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Daniel Bekele",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "CAMPUS_ADMIN",
    permissions: [
      "campus.view",
      "user.manage",
      "department.manage",
      "department.view",
      "member.register",
      "member.import_excel",
      "member.view_all",
      "member.view_dept",
      "allocation.configure",
      "allocation.run",
      "allocation.approve",
      "member.reassign",
      "member.assign_exception",
      "reports.view",
      "export.excel",
      "audit.view",
    ],
  },
  "regofficer@c-cimas.org": {
    id: "u0000000-0000-0000-0000-000000000003",
    email: "regofficer@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Hanna Girma",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "REGISTRATION_OFFICER",
    permissions: [
      "campus.view",
      "member.register",
      "member.import_excel",
      "member.view_all",
      "department.view",
    ],
  },
  "choirlead@c-cimas.org": {
    id: "u0000000-0000-0000-0000-000000000004",
    email: "choirlead@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Yonas Alemu",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "DEPT_MANAGER",
    permissions: [
      "campus.view",
      "department.view",
      "member.view_dept",
      "reports.view",
      "export.excel",
    ],
  },
  "evaluator@c-cimas.org": {
    id: "u0000000-0000-0000-0000-000000000005",
    email: "evaluator@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Dr. Aster Melaku",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "EVALUATOR",
    permissions: [
      "campus.view",
      "department.view",
      "member.view_all",
      "reports.view",
      "export.excel",
      "audit.view",
    ],
  },
  "auditor@c-cimas.org": {
    id: "u0000000-0000-0000-0000-000000000006",
    email: "auditor@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Ato Michael Gebre",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "VIEWER_AUDITOR",
    permissions: [
      "campus.view",
      "department.view",
      "member.view_all",
      "reports.view",
      "audit.view",
    ],
  },
};

export class AuthService {
  static async login(input: LoginInput) {
    const user = DEMO_USERS[input.email];

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const payload: AuthSessionPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      campusId: user.campusId,
      role: user.role,
      permissions: user.permissions,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        campusId: user.campusId,
        campusName: user.campusName,
        permissions: user.permissions,
      },
    };
  }

  static getProfileById(userId: string) {
    const found = Object.values(DEMO_USERS).find((u) => u.id === userId);
    if (!found) return null;
    return {
      id: found.id,
      email: found.email,
      fullName: found.fullName,
      role: found.role,
      campusId: found.campusId,
      campusName: found.campusName,
      permissions: found.permissions,
    };
  }
}

