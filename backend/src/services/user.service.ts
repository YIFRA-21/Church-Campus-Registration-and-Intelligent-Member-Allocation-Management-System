import bcrypt from "bcryptjs";
import { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";
import { AuthSessionPayload, SystemRole } from "../schemas/auth.schema";
import { ADMIN_PERMISSIONS, EVALUATOR_PERMISSIONS } from "./auth.service";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  campusId: string | null;
  campusName: string | null;
  role: SystemRole;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ROLES_CATALOG = [
  {
    name: "ADMIN",
    title: "System Administrator",
    description: "Full administrative control over campuses, departments, members, allocation, evaluations, and reports",
    permissions: ADMIN_PERMISSIONS,
  },
  {
    name: "EVALUATOR",
    title: "Evaluator",
    description: "Restricted access to assigned evaluation tasks, member assessments, scoring, drafts, and submissions",
    permissions: EVALUATOR_PERMISSIONS,
  },
];

const INITIAL_USERS: UserRecord[] = [
  {
    id: "f0000000-0000-0000-0000-000000000001",
    email: "admin@c-cimas.org",
    fullName: "Rev. Solomon Tadesse (Admin)",
    phoneNumber: "+251911000001",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "ADMIN",
    permissions: ADMIN_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "f0000000-0000-0000-0000-000000000002",
    email: "evaluator@c-cimas.org",
    fullName: "Dr. Aster Melaku (Evaluator)",
    phoneNumber: "+251911000005",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "EVALUATOR",
    permissions: EVALUATOR_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let usersStore: UserRecord[] = [...INITIAL_USERS];

export class UserService {
  static getRoles() {
    return ROLES_CATALOG;
  }

  static async getAll(currentUser: AuthSessionPayload): Promise<UserRecord[]> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can view user accounts");
    }
    return usersStore;
  }

  static async getById(id: string, currentUser: AuthSessionPayload): Promise<UserRecord | null> {
    if (currentUser.role !== "ADMIN" && currentUser.userId !== id) {
      throw new Error("Forbidden: Access restricted to Administrators");
    }

    const user = usersStore.find((u) => u.id === id);
    return user || null;
  }

  static async create(input: CreateUserInput, currentUser: AuthSessionPayload): Promise<UserRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can create accounts");
    }

    const emailExists = usersStore.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (emailExists) {
      throw new Error(`Email "${input.email}" is already registered`);
    }

    const roleConfig = ROLES_CATALOG.find((r) => r.name === input.role);
    const assignedPermissions = input.customPermissions && input.customPermissions.length > 0
      ? input.customPermissions
      : roleConfig?.permissions || [];

    const newUser: UserRecord = {
      id: `f0000000-0000-0000-0000-${(usersStore.length + 1).toString().padStart(12, "0")}`,
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      phoneNumber: input.phoneNumber || "",
      campusId: input.campusId || null,
      campusName: input.campusId ? "Assigned Campus" : "Global Oversight",
      role: input.role,
      permissions: assignedPermissions,
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
    currentUser: AuthSessionPayload
  ): Promise<UserRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can update accounts");
    }

    const userIndex = usersStore.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error("User account not found");
    }

    const existing = usersStore[userIndex];
    let updatedPermissions = existing.permissions;

    if (input.role && input.role !== existing.role) {
      const roleConfig = ROLES_CATALOG.find((r) => r.name === input.role);
      updatedPermissions = input.customPermissions || roleConfig?.permissions || [];
    } else if (input.customPermissions) {
      updatedPermissions = input.customPermissions;
    }

    const updatedUser: UserRecord = {
      ...existing,
      fullName: input.fullName ?? existing.fullName,
      phoneNumber: input.phoneNumber ?? existing.phoneNumber,
      campusId: input.campusId !== undefined ? input.campusId : existing.campusId,
      role: input.role ?? existing.role,
      permissions: updatedPermissions,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      updatedAt: new Date().toISOString(),
    };

    usersStore[userIndex] = updatedUser;
    return updatedUser;
  }

  static async delete(id: string, currentUser: AuthSessionPayload): Promise<boolean> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can remove accounts");
    }

    if (id === currentUser.userId) {
      throw new Error("Cannot delete your own administrator account");
    }

    const userIndex = usersStore.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error("User account not found");
    }

    usersStore.splice(userIndex, 1);
    return true;
  }
}
