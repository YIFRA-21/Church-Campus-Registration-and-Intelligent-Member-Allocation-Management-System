import {
  CreateCampusInput,
  UpdateCampusInput,
  ChangeCampusStatusInput,
  CampusQueryParams,
  CampusStatus,
} from "../schemas/campus.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";

export interface CampusContactRecord {
  id: string;
  campusId: string;
  contactName: string;
  position: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampusStatusHistoryRecord {
  id: string;
  campusId: string;
  oldStatus: CampusStatus;
  newStatus: CampusStatus;
  reason: string;
  changedBy: string; // User ID
  changedByName: string; // Full name
  changedAt: string;
}

export interface CampusRecord {
  id: string;
  code: string;
  name: string;
  description?: string;
  region: string;
  city: string;
  subCity?: string;
  woreda?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  status: CampusStatus;
  isActive: boolean;
  memberCount: number;
  departmentCount: number;
  contacts: CampusContactRecord[];
  statusHistory: CampusStatusHistoryRecord[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Initial seed data with contacts and history
const INITIAL_CAMPUSES: CampusRecord[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    code: "ADD-01",
    name: "Main Campus (Addis Ababa)",
    description: "Central Cathedral Diocesan Campus Ministry Center",
    region: "Addis Ababa",
    city: "Addis Ababa",
    subCity: "Arada Sub-City",
    woreda: "Woreda 01",
    address: "Arat Kilo Central Holy Trinity Cathedral Compound",
    phoneNumber: "+251111223344",
    email: "addis@c-cimas.org",
    status: "ACTIVE",
    isActive: true,
    memberCount: 25,
    departmentCount: 5,
    contacts: [
      {
        id: "cc000000-0000-0000-0000-000000000001",
        campusId: "a0000000-0000-0000-0000-000000000001",
        contactName: "Rev. Solomon Tadesse",
        position: "Diocesan Lead Coordinator",
        phone: "+251911223344",
        email: "solomon.tadesse@c-cimas.org",
        isPrimary: true,
        createdAt: "2026-01-10T08:00:00.000Z",
        updatedAt: "2026-01-10T08:00:00.000Z",
      },
      {
        id: "cc000000-0000-0000-0000-000000000002",
        campusId: "a0000000-0000-0000-0000-000000000001",
        contactName: "Deacon Daniel Mekonnen",
        position: "Campus Registrar & Secretariat",
        phone: "+251922334455",
        email: "daniel.m@c-cimas.org",
        isPrimary: false,
        createdAt: "2026-01-15T09:30:00.000Z",
        updatedAt: "2026-01-15T09:30:00.000Z",
      },
    ],
    statusHistory: [
      {
        id: "csh00000-0000-0000-0000-000000000001",
        campusId: "a0000000-0000-0000-0000-000000000001",
        oldStatus: "INACTIVE",
        newStatus: "ACTIVE",
        reason: "Initial diocese charter registration and campus formal commissioning",
        changedBy: "f0000000-0000-0000-0000-000000000001",
        changedByName: "Rev. Solomon Tadesse (Admin)",
        changedAt: "2026-01-10T08:00:00.000Z",
      },
    ],
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: "2026-01-10T08:00:00.000Z",
    createdBy: "f0000000-0000-0000-0000-000000000001",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    code: "BOL-02",
    name: "Bole Sub-Campus",
    description: "East Addis Regional Student Fellowship & Outreach Center",
    region: "Addis Ababa",
    city: "Addis Ababa",
    subCity: "Bole Sub-City",
    woreda: "Woreda 03",
    address: "Bole Medhanealem District",
    phoneNumber: "+251111334455",
    email: "bole@c-cimas.org",
    status: "ACTIVE",
    isActive: true,
    memberCount: 0,
    departmentCount: 0,
    contacts: [
      {
        id: "cc000000-0000-0000-0000-000000000003",
        campusId: "a0000000-0000-0000-0000-000000000002",
        contactName: "Ato Yonas Kebede",
        position: "Sub-Campus Director",
        phone: "+251933445566",
        email: "yonas.k@c-cimas.org",
        isPrimary: true,
        createdAt: "2026-02-01T10:00:00.000Z",
        updatedAt: "2026-02-01T10:00:00.000Z",
      },
    ],
    statusHistory: [
      {
        id: "csh00000-0000-0000-0000-000000000002",
        campusId: "a0000000-0000-0000-0000-000000000002",
        oldStatus: "INACTIVE",
        newStatus: "ACTIVE",
        reason: "Sub-campus inauguration and university fellowship integration",
        changedBy: "f0000000-0000-0000-0000-000000000001",
        changedByName: "Rev. Solomon Tadesse (Admin)",
        changedAt: "2026-02-01T10:00:00.000Z",
      },
    ],
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-02-01T10:00:00.000Z",
    createdBy: "f0000000-0000-0000-0000-000000000001",
  },
];

let campusesStore: CampusRecord[] = [...INITIAL_CAMPUSES];

export class CampusService {
  /**
   * Get all campuses with filtering, searching, sorting, and pagination
   */
  static async getAll(
    paramsOrUser: Partial<CampusQueryParams> | AuthSessionPayload = {},
    maybeUser?: AuthSessionPayload
  ): Promise<{
    campuses: CampusRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    let params: Partial<CampusQueryParams> = {};
    let user: AuthSessionPayload;

    if (maybeUser) {
      params = paramsOrUser as Partial<CampusQueryParams>;
      user = maybeUser;
    } else if ("userId" in paramsOrUser || "role" in paramsOrUser) {
      user = paramsOrUser as AuthSessionPayload;
      params = {};
    } else {
      params = paramsOrUser as Partial<CampusQueryParams>;
      user = { userId: "system", fullName: "System", email: "", role: "ADMIN", permissions: [] };
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const search = (params.search || "").toLowerCase().trim();
    const status = params.status || "ALL";
    const region = (params.region || "").toLowerCase().trim();
    const city = (params.city || "").toLowerCase().trim();
    const sortBy = params.sortBy || "createdAt";
    const sortOrder = params.sortOrder || "desc";

    // Tenancy isolation: Evaluator bound to assigned campus unless Admin
    let filtered = [...campusesStore];
    if (user.role !== "ADMIN" && user.campusId) {
      filtered = filtered.filter((c) => c.id === user.campusId);
    }

    // Filter by status
    if (status !== "ALL") {
      filtered = filtered.filter((c) => c.status === status);
    }

    // Filter by search (name, code, city, email, phone)
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.code.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search) ||
          (c.region && c.region.toLowerCase().includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.phoneNumber && c.phoneNumber.includes(search)) ||
          c.contacts.some((contact) => contact.contactName.toLowerCase().includes(search))
      );
    }

    // Filter by region / city
    if (region) {
      filtered = filtered.filter((c) => c.region && c.region.toLowerCase().includes(region));
    }
    if (city) {
      filtered = filtered.filter((c) => c.city.toLowerCase().includes(city));
    }

    // Sort
    filtered.sort((a, b) => {
      let valA: string | number = a.createdAt;
      let valB: string | number = b.createdAt;

      if (sortBy === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === "code") {
        valA = a.code.toLowerCase();
        valB = b.code.toLowerCase();
      } else if (sortBy === "city") {
        valA = a.city.toLowerCase();
        valB = b.city.toLowerCase();
      } else if (sortBy === "status") {
        valA = a.status;
        valB = b.status;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      campuses: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get campus details by UUID
   */
  static async getById(id: string, user?: AuthSessionPayload): Promise<CampusRecord | null> {
    const campus = campusesStore.find((c) => c.id === id);
    if (!campus) return null;

    if (user && user.role !== "ADMIN" && user.campusId && user.campusId !== campus.id) {
      throw new Error("Forbidden: Access to another campus organization is restricted");
    }

    return campus;
  }

  /**
   * Create a new campus with primary contact and status history
   */
  static async create(input: CreateCampusInput, user: AuthSessionPayload): Promise<CampusRecord> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can register new campuses");
    }

    const codeClean = input.code.toUpperCase().trim();
    const codeExists = campusesStore.some((c) => c.code.toLowerCase() === codeClean.toLowerCase());
    if (codeExists) {
      throw new Error(`Campus code "${codeClean}" already exists. Campus codes must be globally unique.`);
    }

    const campusId = `a0000000-0000-0000-0000-${(campusesStore.length + 1).toString().padStart(12, "0")}`;
    const initialStatus = input.status || "ACTIVE";
    const now = new Date().toISOString();

    const contacts: CampusContactRecord[] = [];
    if (input.primaryContactName && input.primaryContactPhone) {
      contacts.push({
        id: `cc000000-0000-0000-0000-${(campusesStore.length * 10 + 1).toString().padStart(12, "0")}`,
        campusId,
        contactName: input.primaryContactName,
        position: input.primaryContactPosition || "Campus Coordinator",
        phone: input.primaryContactPhone,
        email: input.primaryContactEmail || input.email || "",
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const initialHistory: CampusStatusHistoryRecord = {
      id: `csh00000-0000-0000-0000-${(campusesStore.length * 10 + 1).toString().padStart(12, "0")}`,
      campusId,
      oldStatus: "INACTIVE",
      newStatus: initialStatus,
      reason: "Initial campus registration in C-CIMAS directory",
      changedBy: user.userId,
      changedByName: user.fullName || "System Administrator",
      changedAt: now,
    };

    const newCampus: CampusRecord = {
      id: campusId,
      code: codeClean,
      name: input.name.trim(),
      description: input.description || "",
      region: input.region || "Addis Ababa",
      city: input.city.trim(),
      subCity: input.subCity || "",
      woreda: input.woreda || "",
      address: input.address || "",
      phoneNumber: input.phoneNumber || "",
      email: input.email || "",
      status: initialStatus,
      isActive: initialStatus === "ACTIVE",
      memberCount: 0,
      departmentCount: 0,
      contacts,
      statusHistory: [initialHistory],
      createdAt: now,
      updatedAt: now,
      createdBy: user.userId,
    };

    campusesStore.push(newCampus);
    return newCampus;
  }

  /**
   * Update campus details
   */
  static async update(
    id: string,
    input: UpdateCampusInput,
    user: AuthSessionPayload
  ): Promise<CampusRecord> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can modify campus information");
    }

    const campus = campusesStore.find((c) => c.id === id);
    if (!campus) {
      throw new Error("Campus not found");
    }

    if (input.code) {
      const codeClean = input.code.toUpperCase().trim();
      if (codeClean !== campus.code) {
        const codeExists = campusesStore.some(
          (c) => c.id !== id && c.code.toLowerCase() === codeClean.toLowerCase()
        );
        if (codeExists) {
          throw new Error(`Campus code "${codeClean}" is already in use by another campus.`);
        }
        campus.code = codeClean;
      }
    }

    if (input.name !== undefined) campus.name = input.name.trim();
    if (input.description !== undefined) campus.description = input.description;
    if (input.region !== undefined) campus.region = input.region;
    if (input.city !== undefined) campus.city = input.city.trim();
    if (input.subCity !== undefined) campus.subCity = input.subCity;
    if (input.woreda !== undefined) campus.woreda = input.woreda;
    if (input.address !== undefined) campus.address = input.address;
    if (input.phoneNumber !== undefined) campus.phoneNumber = input.phoneNumber;
    if (input.email !== undefined) campus.email = input.email;

    // Primary contact update if provided
    if (input.primaryContactName && input.primaryContactPhone) {
      const existingPrimary = campus.contacts.find((c) => c.isPrimary);
      const now = new Date().toISOString();
      if (existingPrimary) {
        existingPrimary.contactName = input.primaryContactName;
        existingPrimary.phone = input.primaryContactPhone;
        if (input.primaryContactPosition) existingPrimary.position = input.primaryContactPosition;
        if (input.primaryContactEmail) existingPrimary.email = input.primaryContactEmail;
        existingPrimary.updatedAt = now;
      } else {
        campus.contacts.push({
          id: `cc000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
          campusId: campus.id,
          contactName: input.primaryContactName,
          position: input.primaryContactPosition || "Campus Coordinator",
          phone: input.primaryContactPhone,
          email: input.primaryContactEmail || campus.email || "",
          isPrimary: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    campus.updatedAt = new Date().toISOString();
    return campus;
  }

  /**
   * Change Campus Status with mandatory reason and transactional history entry
   */
  static async changeStatus(
    id: string,
    input: ChangeCampusStatusInput,
    user: AuthSessionPayload
  ): Promise<CampusRecord> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can change campus operational status");
    }

    const campus = campusesStore.find((c) => c.id === id);
    if (!campus) {
      throw new Error("Campus not found");
    }

    if (campus.status === input.status) {
      return campus; // No change needed
    }

    const oldStatus = campus.status;
    const newStatus = input.status;
    const now = new Date().toISOString();

    // Create immutable audit history record
    const historyRecord: CampusStatusHistoryRecord = {
      id: `csh00000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      campusId: campus.id,
      oldStatus,
      newStatus,
      reason: input.reason.trim(),
      changedBy: user.userId,
      changedByName: user.fullName || "Administrator",
      changedAt: now,
    };

    campus.status = newStatus;
    campus.isActive = newStatus === "ACTIVE";
    campus.statusHistory.unshift(historyRecord);
    campus.updatedAt = now;

    return campus;
  }

  /**
   * Manage contacts for a campus (enforcing <= 1 primary contact)
   */
  static async updateContacts(
    campusId: string,
    contactsInput: { contactName: string; position: string; phone: string; email?: string; isPrimary: boolean }[],
    user: AuthSessionPayload
  ): Promise<CampusContactRecord[]> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can manage campus contacts");
    }

    const campus = campusesStore.find((c) => c.id === campusId);
    if (!campus) {
      throw new Error("Campus not found");
    }

    const primaryCount = contactsInput.filter((c) => c.isPrimary).length;
    if (primaryCount > 1) {
      throw new Error("Validation Error: A campus cannot have more than one primary contact.");
    }

    const now = new Date().toISOString();
    campus.contacts = contactsInput.map((c, idx) => ({
      id: `cc000000-0000-0000-0000-${(campusId.slice(-4) + idx).padStart(12, "0")}`,
      campusId: campus.id,
      contactName: c.contactName.trim(),
      position: c.position.trim(),
      phone: c.phone.trim(),
      email: c.email || "",
      isPrimary: c.isPrimary,
      createdAt: now,
      updatedAt: now,
    }));

    campus.updatedAt = now;
    return campus.contacts;
  }

  /**
   * Get status history timeline for a campus
   */
  static async getStatusHistory(
    campusId: string,
    user: AuthSessionPayload
  ): Promise<CampusStatusHistoryRecord[]> {
    const campus = await this.getById(campusId, user);
    if (!campus) {
      throw new Error("Campus not found");
    }
    return campus.statusHistory;
  }

  /**
   * Get high-level executive dashboard summary metrics
   */
  static async getDashboardSummary(user: AuthSessionPayload): Promise<{
    totalCampuses: number;
    activeCampuses: number;
    inactiveCampuses: number;
    archivedCampuses: number;
    totalEnrolledMembers: number;
    totalAssignedMinistries: number;
    recentCampuses: CampusRecord[];
    recentStatusChanges: CampusStatusHistoryRecord[];
  }> {
    let list = [...campusesStore];
    if (user.role !== "ADMIN" && user.campusId) {
      list = list.filter((c) => c.id === user.campusId);
    }

    const totalCampuses = list.length;
    const activeCampuses = list.filter((c) => c.status === "ACTIVE").length;
    const inactiveCampuses = list.filter((c) => c.status === "INACTIVE").length;
    const archivedCampuses = list.filter((c) => c.status === "ARCHIVED").length;
    const totalEnrolledMembers = list.reduce((sum, c) => sum + (c.memberCount || 0), 0);
    const totalAssignedMinistries = list.reduce((sum, c) => sum + (c.departmentCount || 0), 0);

    const recentCampuses = [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const allHistory: CampusStatusHistoryRecord[] = [];
    list.forEach((c) => allHistory.push(...c.statusHistory));
    allHistory.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

    return {
      totalCampuses,
      activeCampuses,
      inactiveCampuses,
      archivedCampuses,
      totalEnrolledMembers,
      totalAssignedMinistries,
      recentCampuses,
      recentStatusChanges: allHistory.slice(0, 10),
    };
  }

  /**
   * Toggle activation (backward compatible)
   */
  static async toggleActive(id: string, user: AuthSessionPayload): Promise<CampusRecord> {
    const campus = await this.getById(id, user);
    if (!campus) throw new Error("Campus not found");
    const targetStatus = campus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    return this.changeStatus(
      id,
      { status: targetStatus, reason: `Administrative status toggle to ${targetStatus}` },
      user
    );
  }

  /**
   * Soft delete or archive campus
   */
  static async delete(id: string, user: AuthSessionPayload): Promise<boolean> {
    if (user.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can archive or delete campuses");
    }

    const campus = campusesStore.find((c) => c.id === id);
    if (!campus) return false;

    // Rule 7: Campuses are archived, not physically deleted if they have dependencies
    if (campus.memberCount > 0 || campus.departmentCount > 0) {
      await this.changeStatus(
        id,
        {
          status: "ARCHIVED",
          reason: `Campus archived due to decommissioning with ${campus.memberCount} members and ${campus.departmentCount} departments.`,
        },
        user
      );
      return true;
    }

    campusesStore = campusesStore.filter((c) => c.id !== id);
    return true;
  }
}
