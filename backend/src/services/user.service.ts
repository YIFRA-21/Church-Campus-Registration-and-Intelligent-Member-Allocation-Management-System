import bcrypt from "bcryptjs";
import { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  campusId: string | null;
  campusName: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLES_CATALOG = [
  {
    name: "SUPER_ADMIN",
    title: "Super Administrator",
    description: "Global system governance across all campuses",
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
  {
    name: "CAMPUS_ADMIN",
    title: "Campus Administrator",
    description: "Full administrative operations over assigned campus",
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
  {
    name: "REGISTRATION_OFFICER",
    title: "Registration Officer",
    description: "Member registration and Excel bulk imports",
    permissions: [
      "campus.view",
      "member.register",
      "member.import_excel",
      "member.view_all",
      "department.view",
    ],
  },
  {
    name: "DEPT_MANAGER",
    title: "Department Manager",
    description: "Restricted management exclusively to own assigned department",
    permissions: [
      "campus.view",
      "department.view",
      "member.view_dept",
      "reports.view",
      "export.excel",
    ],
  },
  {
    name: "EVALUATOR",
    title: "Evaluator",
    description: "Monitoring, evaluation, and analytics reports review",
    permissions: [
      "campus.view",
      "department.view",
      "member.view_all",
      "reports.view",
      "export.excel",
      "audit.view",
    ],
  },
  {
    name: "VIEWER_AUDITOR",
    title: "Viewer / Auditor",
    description: "Read-only access to audit logs and evaluation reports",
    permissions: [
      "campus.view",
      "department.view",
      "member.view_all",
      "reports.view",
      "audit.view",
    ],
  },
];

let usersStore: UserRecord[] = [
  {
    id: "u0000000-0000-0000-0000-000000000001",
    email: "admin@c-cimas.org",
    fullName: "Rev. Solomon Tadesse",
    phoneNumber: "+251911000001",
    campusId: null,
    campusName: "Global Oversight (All Campuses)",
    role: "SUPER_ADMIN",
    permissions: ROLES_CATALOG.find((r) => r.name === "SUPER_ADMIN")!.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u0000000-0000-0000-0000-000000000002",
    email: "campusadmin@c-cimas.org",
    fullName: "Daniel Bekele",
    phoneNumber: "+251911000002",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "CAMPUS_ADMIN",
    permissions: ROLES_CATALOG.find((r) => r.name === "CAMPUS_ADMIN")!.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u0000000-0000-0000-0000-000000000003",
    email: "regofficer@c-cimas.org",
    fullName: "Hanna Girma",
    phoneNumber: "+251911000003",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "REGISTRATION_OFFICER",
    permissions: ROLES_CATALOG.find((r) => r.name === "REGISTRATION_OFFICER")!.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u0000000-0000-0000-0000-000000000004",
    email: "choirlead@c-cimas.org",
    fullName: "Yonas Alemu",
    phoneNumber: "+251911000004",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "DEPT_MANAGER",
    permissions: ROLES_CATALOG.find((r) => r.name === "DEPT_MANAGER")!.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u0000000-0000-0000-0000-000000000005",
    email: "evaluator@c-cimas.org",
    fullName: "Dr. Aster Melaku",
    phoneNumber: "+251911000005",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "EVALUATOR",
    permissions: ROLES_CATALOG.find((r) => r.name === "EVALUATOR")!.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u0000000-0000-0000-0000-000000000006",
    email: "auditor@c-cimas.org",
    fullName: "Ato Michael Gebre",
    phoneNumber: "+251911000006",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "VIEWER_AUDITOR",
    permissions: ROLES_CATALOG.find((r) => r.name === "VIEWER_AUDITOR")!.permissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class UserService {
  static getRoles() {
    return ROLES_CATALOG;
  }

  static async getAll(user: AuthSessionPayload): Promise<UserRecord[]> {
    if (user.role === "SUPER_ADMIN") {
      return usersStore;
    }
    // Tenant Scoping: Campus Admin can only manage users in their assigned campus
    return usersStore.filter((u) => u.campusId === user.campusId);
  }

  static async getById(id: string, user: AuthSessionPayload): Promise<UserRecord | null> {
    const target = usersStore.find((u) => u.id === id);
    if (!target) return null;

    if (user.role !== "SUPER_ADMIN" && target.campusId !== user.campusId) {
      throw new Error("Forbidden: User belongs to another campus organization");
    }

    return target;
  }

  static async create(input: CreateUserInput, user: AuthSessionPayload): Promise<UserRecord> {
    if (user.role !== "SUPER_ADMIN") {
      // Campus Admin cannot create Super Admins or assign to another campus
      if (input.role === "SUPER_ADMIN") {
        throw new Error("Forbidden: Only Super Administrators can create Super Admin accounts");
      }
      if (input.campusId && input.campusId !== user.campusId) {
        throw new Error("Forbidden: Cannot create a user assigned to another campus organization");
      }
    }

    const emailExists = usersStore.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (emailExists) {
      throw new Error(`Email "${input.email}" is already registered`);
    }

    const effectiveCampusId = user.role === "SUPER_ADMIN" ? input.campusId || null : user.campusId;
    const roleDef = ROLES_CATALOG.find((r) => r.name === input.role);
    const basePermissions = roleDef ? roleDef.permissions : [];
    const customPerms = input.customPermissions || [];
    const mergedPermissions = Array.from(new Set([...basePermissions, ...customPerms]));

    const newUser: UserRecord = {
      id: `u0000000-0000-0000-0000-${(usersStore.length + 1).toString().padStart(12, "0")}`,
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      phoneNumber: input.phoneNumber || "",
      campusId: effectiveCampusId,
      campusName: effectiveCampusId ? "Assigned Campus" : "Global Oversight",
      role: input.role,
      permissions: mergedPermissions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usersStore.push(newUser);
    return newUser;
  }

  static async update(
    id: string,
    input: UpdateUserInput,
    user: AuthSessionPayload
  ): Promise<UserRecord> {
    const target = await this.getById(id, user);
    if (!target) {
      throw new Error("User not found");
    }

    if (user.role !== "SUPER_ADMIN") {
      if (input.role === "SUPER_ADMIN") {
        throw new Error("Forbidden: Cannot elevate user to Super Admin");
      }
      if (input.campusId && input.campusId !== user.campusId) {
        throw new Error("Forbidden: Cannot reassign user to another campus");
      }
    }

    if (input.fullName !== undefined) target.fullName = input.fullName;
    if (input.phoneNumber !== undefined) target.phoneNumber = input.phoneNumber;
    if (input.isActive !== undefined) target.isActive = input.isActive;
    if (input.campusId !== undefined && user.role === "SUPER_ADMIN") {
      target.campusId = input.campusId;
    }
    if (input.role !== undefined) {
      target.role = input.role;
      const roleDef = ROLES_CATALOG.find((r) => r.name === input.role);
      target.permissions = roleDef ? roleDef.permissions : target.permissions;
    }
    if (input.customPermissions !== undefined) {
      target.permissions = Array.from(new Set([...target.permissions, ...input.customPermissions]));
    }
    target.updatedAt = new Date().toISOString();

    return target;
  }

  static async delete(id: string, user: AuthSessionPayload): Promise<boolean> {
    const target = await this.getById(id, user);
    if (!target) {
      throw new Error("User not found");
    }

    if (target.id === user.userId) {
      throw new Error("Cannot delete your own active administrative account");
    }

    const initialLength = usersStore.length;
    usersStore = usersStore.filter((u) => u.id !== id);
    return usersStore.length < initialLength;
  }
}
