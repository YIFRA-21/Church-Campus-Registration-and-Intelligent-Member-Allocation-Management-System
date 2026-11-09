import { CreateCampusInput, UpdateCampusInput } from "../schemas/campus.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";

export interface CampusRecord {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  isActive: boolean;
  memberCount: number;
  departmentCount: number;
  createdAt: string;
  updatedAt: string;
}

// In-memory campus repository with pre-seeded campuses
const INITIAL_CAMPUSES: CampusRecord[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    code: "ADD-01",
    name: "Main Campus (Addis Ababa)",
    city: "Addis Ababa",
    address: "Arat Kilo Central Cathedral",
    phoneNumber: "+251111223344",
    email: "addis@c-cimas.org",
    isActive: true,
    memberCount: 28,
    departmentCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    code: "BOL-02",
    name: "Bole Sub-Campus",
    city: "Addis Ababa",
    address: "Bole Medhanealem District",
    phoneNumber: "+251111334455",
    email: "bole@c-cimas.org",
    isActive: true,
    memberCount: 0,
    departmentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let campusesStore: CampusRecord[] = [...INITIAL_CAMPUSES];

export class CampusService {
  static async getAll(user: AuthSessionPayload): Promise<CampusRecord[]> {
    if (user.role === "SUPER_ADMIN") {
      return campusesStore;
    }
    // Tenant scoping: Return only the campus matching the user's campusId
    return campusesStore.filter((c) => c.id === user.campusId);
  }

  static async getById(id: string, user: AuthSessionPayload): Promise<CampusRecord | null> {
    const campus = campusesStore.find((c) => c.id === id);
    if (!campus) return null;

    if (user.role !== "SUPER_ADMIN" && user.campusId !== campus.id) {
      throw new Error("Forbidden: Access to another campus organization is restricted");
    }

    return campus;
  }

  static async create(input: CreateCampusInput, user: AuthSessionPayload): Promise<CampusRecord> {
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only Super Administrators can register new campuses");
    }

    const codeExists = campusesStore.some((c) => c.code.toLowerCase() === input.code.toLowerCase());
    if (codeExists) {
      throw new Error(`Campus code "${input.code}" already exists.`);
    }

    const newCampus: CampusRecord = {
      id: `a0000000-0000-0000-0000-${(campusesStore.length + 1).toString().padStart(12, "0")}`,
      code: input.code.toUpperCase(),
      name: input.name,
      city: input.city,
      address: input.address || "",
      phoneNumber: input.phoneNumber || "",
      email: input.email || "",
      isActive: true,
      memberCount: 0,
      departmentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    campusesStore.push(newCampus);
    return newCampus;
  }

  static async update(
    id: string,
    input: UpdateCampusInput,
    user: AuthSessionPayload
  ): Promise<CampusRecord> {
    const campus = await this.getById(id, user);
    if (!campus) {
      throw new Error("Campus not found");
    }

    if (input.code && input.code.toUpperCase() !== campus.code) {
      const codeExists = campusesStore.some(
        (c) => c.id !== id && c.code.toLowerCase() === input.code!.toLowerCase()
      );
      if (codeExists) {
        throw new Error(`Campus code "${input.code}" is already in use by another campus.`);
      }
      campus.code = input.code.toUpperCase();
    }

    if (input.name !== undefined) campus.name = input.name;
    if (input.city !== undefined) campus.city = input.city;
    if (input.address !== undefined) campus.address = input.address;
    if (input.phoneNumber !== undefined) campus.phoneNumber = input.phoneNumber;
    if (input.email !== undefined) campus.email = input.email;
    if (input.isActive !== undefined) campus.isActive = input.isActive;
    campus.updatedAt = new Date().toISOString();

    return campus;
  }

  static async delete(id: string, user: AuthSessionPayload): Promise<boolean> {
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Only Super Administrators can delete a campus");
    }

    const initialLength = campusesStore.length;
    campusesStore = campusesStore.filter((c) => c.id !== id);
    return campusesStore.length < initialLength;
  }
}
