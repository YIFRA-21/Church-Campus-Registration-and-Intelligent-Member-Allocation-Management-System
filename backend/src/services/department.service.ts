import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  ConfigureTargetsInput,
  ValidateTargetsInput,
  FinalizeTargetsInput,
  ChangeDepartmentStatusInput,
  UpdateDepartmentCapacityInput,
  DepartmentQueryParams,
  DepartmentStatus,
  EligibilityRuleInput,
} from "../schemas/department.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";
import { calculateLargestRemainderTargets, CalculatedDepartmentTarget } from "../utils/rounding";
import { MemberService } from "./member.service";
import ExcelJS from "exceljs";

export interface DepartmentStatusHistoryRecord {
  id: string;
  departmentId: string;
  oldStatus: DepartmentStatus;
  newStatus: DepartmentStatus;
  reason: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

export interface DepartmentCapacityHistoryRecord {
  id: string;
  departmentId: string;
  campusId: string;
  previousCapacity: number;
  newCapacity: number;
  changedBy: string;
  changedByName: string;
  changeReason: string;
  confirmationRequired: boolean;
  confirmationGiven: boolean;
  changedAt: string;
}

export interface EligibilityRuleRecord {
  id: string;
  departmentId: string;
  ruleName: string;
  ruleType: string;
  operator: string;
  value: any;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRecord {
  id: string;
  campusId: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  allocatedMembersCount: number;
  targetPercentage: number;
  priority: number;
  status: DepartmentStatus;
  isActive: boolean;
  overCapacity: boolean;
  statusHistory: DepartmentStatusHistoryRecord[];
  capacityHistory: DepartmentCapacityHistoryRecord[];
  eligibilityRules: EligibilityRuleRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface TargetConfigurationRecord {
  id: string;
  campusId: string;
  cycleName: string;
  targets: { departmentId: string; percentage: number }[];
  projectedAllocations?: CalculatedDepartmentTarget[];
  isActive: boolean;
  version: number;
  finalizedBy?: string;
  finalizedByName?: string;
  createdAt: string;
}

export interface DepartmentDashboardSummary {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  archivedDepartments: number;
  nearCapacityCount: number;
  overCapacityCount: number;
  totalCapacity: number;
  totalAllocated: number;
  overallUtilization: number;
  isTargetConfigured: boolean;
  isTargetSumValid: boolean;
  currentTargetSum: number;
  currentTargetCycleName: string;
}

// Initial 5 departments per the Master Architecture specification (Sum: 100.0%)
const INITIAL_DEPARTMENTS: DepartmentRecord[] = [
  {
    id: "d0000000-0000-0000-0000-000000000001",
    campusId: "a0000000-0000-0000-0000-000000000001",
    code: "CHOIR-01",
    name: "Choir & Hymns Ministry",
    description: "Liturgical music, hymns, spiritual chant, and sacred song service",
    capacity: 600,
    allocatedMembersCount: 4,
    targetPercentage: 30.0,
    priority: 1,
    status: "ACTIVE",
    isActive: true,
    overCapacity: false,
    statusHistory: [
      {
        id: "dsh00000-0000-0000-0000-000000000001",
        departmentId: "d0000000-0000-0000-0000-000000000001",
        oldStatus: "INACTIVE",
        newStatus: "ACTIVE",
        reason: "Initial ministry charter registration and diocesan commissioning",
        changedBy: "f0000000-0000-0000-0000-000000000001",
        changedByName: "Rev. Solomon Tadesse (Admin)",
        changedAt: "2026-01-15T09:00:00.000Z",
      },
    ],
    capacityHistory: [
      {
        id: "dch00000-0000-0000-0000-000000000001",
        departmentId: "d0000000-0000-0000-0000-000000000001",
        campusId: "a0000000-0000-0000-0000-000000000001",
        previousCapacity: 500,
        newCapacity: 600,
        changedBy: "f0000000-0000-0000-0000-000000000001",
        changedByName: "Rev. Solomon Tadesse (Admin)",
        changeReason: "Expanded liturgical choir practice hall capacity",
        confirmationRequired: false,
        confirmationGiven: true,
        changedAt: "2026-02-01T10:00:00.000Z",
      },
    ],
    eligibilityRules: [
      {
        id: "er000000-0000-0000-0000-000000000001",
        departmentId: "d0000000-0000-0000-0000-000000000001",
        ruleName: "Sunday School Experience",
        ruleType: "SUNDAY_SCHOOL_YEARS",
        operator: "GREATER_THAN_OR_EQUAL",
        value: 2,
        isMandatory: true,
        isActive: true,
        createdAt: "2026-01-15T09:00:00.000Z",
        updatedAt: "2026-01-15T09:00:00.000Z",
      },
      {
        id: "er000000-0000-0000-0000-000000000002",
        departmentId: "d0000000-0000-0000-0000-000000000001",
        ruleName: "Christian Baptism Required",
        ruleType: "BAPTISM_STATUS",
        operator: "EQUALS",
        value: true,
        isMandatory: true,
        isActive: true,
        createdAt: "2026-01-15T09:00:00.000Z",
        updatedAt: "2026-01-15T09:00:00.000Z",
      },
    ],
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000002",
    campusId: "a0000000-0000-0000-0000-000000000002",
    code: "TEACH-01",
    name: "Spiritual Education & Teaching",
    description: "Doctrinal instruction, youth catechism, bible study coordination",
    capacity: 500,
    allocatedMembersCount: 5,
    targetPercentage: 25.0,
    priority: 2,
    status: "ACTIVE",
    isActive: true,
    overCapacity: false,
    statusHistory: [
      {
        id: "dsh00000-0000-0000-0000-000000000002",
        departmentId: "d0000000-0000-0000-0000-000000000002",
        oldStatus: "INACTIVE",
        newStatus: "ACTIVE",
        reason: "Initial department commissioning",
        changedBy: "f0000000-0000-0000-0000-000000000001",
        changedByName: "Rev. Solomon Tadesse (Admin)",
        changedAt: "2026-01-15T09:00:00.000Z",
      },
    ],
    capacityHistory: [],
    eligibilityRules: [
      {
        id: "er000000-0000-0000-0000-000000000003",
        departmentId: "d0000000-0000-0000-0000-000000000002",
        ruleName: "Minimum 3 Years Sunday School",
        ruleType: "SUNDAY_SCHOOL_YEARS",
        operator: "GREATER_THAN_OR_EQUAL",
        value: 3,
        isMandatory: true,
        isActive: true,
        createdAt: "2026-01-15T09:00:00.000Z",
        updatedAt: "2026-01-15T09:00:00.000Z",
      },
    ],
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000003",
    campusId: "a0000000-0000-0000-0000-000000000001",
    code: "PRAY-01",
    name: "Prayer & Intercession",
    description: "Dedicated campus vigils, intercessory services, fasting coordination",
    capacity: 400,
    allocatedMembersCount: 3,
    targetPercentage: 20.0,
    priority: 3,
    status: "ACTIVE",
    isActive: true,
    overCapacity: false,
    statusHistory: [
      {
        id: "dsh00000-0000-0000-0000-000000000003",
        departmentId: "d0000000-0000-0000-0000-000000000003",
        oldStatus: "INACTIVE",
        newStatus: "ACTIVE",
        reason: "Initial department commissioning",
        changedBy: "f0000000-0000-0000-0000-000000000001",
        changedByName: "Rev. Solomon Tadesse (Admin)",
        changedAt: "2026-01-15T09:00:00.000Z",
      },
    ],
    capacityHistory: [],
    eligibilityRules: [],
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000004",
    campusId: "a0000000-0000-0000-0000-000000000001",
    code: "EVANG-01",
    name: "Evangelism & Outreach",
    description: "New member welcome, university student missions, public ministry",
    capacity: 350,
    allocatedMembersCount: 3,
    targetPercentage: 15.0,
    priority: 4,
    status: "ACTIVE",
    isActive: true,
    overCapacity: false,
    statusHistory: [],
    capacityHistory: [],
    eligibilityRules: [],
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "d0000000-0000-0000-0000-000000000005",
    campusId: "a0000000-0000-0000-0000-000000000001",
    code: "SOC-01",
    name: "Social Service & Charity",
    description: "Community welfare, student charity, medical assistance, emergency aid",
    capacity: 300,
    allocatedMembersCount: 3,
    targetPercentage: 10.0,
    priority: 5,
    status: "ACTIVE",
    isActive: true,
    overCapacity: false,
    statusHistory: [],
    capacityHistory: [],
    eligibilityRules: [],
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
];

// Note: set all initial departments to a0000000-0000-0000-0000-000000000001 for consistent 100% allocation across tests
INITIAL_DEPARTMENTS.forEach((d) => {
  d.campusId = "a0000000-0000-0000-0000-000000000001";
});

let departmentsStore: DepartmentRecord[] = [...INITIAL_DEPARTMENTS];

let targetConfigurationsStore: TargetConfigurationRecord[] = [
  {
    id: "tc000000-0000-0000-0000-000000000001",
    campusId: "a0000000-0000-0000-0000-000000000001",
    cycleName: "2026/2027 Main Campus Annual Allocation",
    targets: INITIAL_DEPARTMENTS.map((d) => ({
      departmentId: d.id,
      percentage: d.targetPercentage,
    })),
    isActive: true,
    version: 1,
    finalizedBy: "f0000000-0000-0000-0000-000000000001",
    finalizedByName: "Rev. Solomon Tadesse (Admin)",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
];

export class DepartmentService {
  /**
   * Universal getAll method supporting either a simple campusId string OR advanced query parameters
   * Always returns an array of DepartmentRecord for full backward compatibility across all modules.
   */
  static async getAll(
    campusIdOrParams?: string | Partial<DepartmentQueryParams>,
    currentUser?: AuthSessionPayload
  ): Promise<DepartmentRecord[]> {
    let list = [...departmentsStore];

    let campusId: string | undefined;
    let status: string | undefined;
    let search: string | undefined;
    let sortBy: string = "priority";
    let sortOrder: number = 1;

    if (typeof campusIdOrParams === "string") {
      campusId = campusIdOrParams;
    } else if (campusIdOrParams) {
      campusId = campusIdOrParams.campusId;
      status = campusIdOrParams.status;
      search = campusIdOrParams.search;
      sortBy = campusIdOrParams.sortBy || "priority";
      sortOrder = campusIdOrParams.sortOrder === "desc" ? -1 : 1;
    }

    // Tenancy filtering
    if (currentUser && currentUser.role !== "ADMIN" && (currentUser as any).campusId) {
      list = list.filter((d) => d.campusId === (currentUser as any).campusId);
    } else if (campusId) {
      list = list.filter((d) => d.campusId === campusId);
    }

    // Status filter
    if (status && status !== "ALL") {
      list = list.filter((d) => d.status === status);
    }

    // Search filter
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }

    // Dynamic overCapacity update
    list.forEach((d) => {
      d.overCapacity = d.allocatedMembersCount > d.capacity;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name) * sortOrder;
      if (sortBy === "code") return a.code.localeCompare(b.code) * sortOrder;
      if (sortBy === "capacity") return (a.capacity - b.capacity) * sortOrder;
      if (sortBy === "utilization") {
        const uA = a.capacity > 0 ? a.allocatedMembersCount / a.capacity : 0;
        const uB = b.capacity > 0 ? b.allocatedMembersCount / b.capacity : 0;
        return (uA - uB) * sortOrder;
      }
      if (sortBy === "createdAt") {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortOrder;
      }
      return (a.priority - b.priority) * sortOrder;
    });

    return list;
  }

  /**
   * Paginated getter with metadata for API controller
   */
  static async getPaginated(
    params: Partial<DepartmentQueryParams> = {},
    currentUser?: AuthSessionPayload
  ): Promise<{
    departments: DepartmentRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const list = await this.getAll(params, currentUser);
    const total = list.length;
    const page = params.page ? Math.max(1, params.page) : 1;
    const limit = params.limit ? Math.max(1, Math.min(100, params.limit)) : 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paginated = list.slice(offset, offset + limit);

    return {
      departments: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get single department by ID
   */
  static async getById(id: string): Promise<DepartmentRecord | null> {
    const dept = departmentsStore.find((d) => d.id === id);
    if (!dept) return null;
    dept.overCapacity = dept.allocatedMembersCount > dept.capacity;
    return dept;
  }

  /**
   * Create a new department with Business Rule 3 (Globally unique code)
   */
  static async create(
    input: CreateDepartmentInput,
    currentUser: AuthSessionPayload
  ): Promise<DepartmentRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can create departments");
    }

    const codeNormalized = input.code.trim().toUpperCase();
    const codeExists = departmentsStore.some(
      (d) => d.code.toLowerCase() === codeNormalized.toLowerCase()
    );
    if (codeExists) {
      throw new Error(
        `Department code "${codeNormalized}" already exists in the system. Department codes must be globally unique.`
      );
    }

    const newId = `d0000000-0000-0000-0000-${(departmentsStore.length + 1)
      .toString()
      .padStart(12, "0")}`;

    const newDept: DepartmentRecord = {
      id: newId,
      campusId: input.campusId,
      code: codeNormalized,
      name: input.name.trim(),
      description: input.description ? input.description.trim() : "",
      capacity: input.capacity,
      allocatedMembersCount: 0,
      targetPercentage: input.targetPercentage || 0,
      priority: input.priority || departmentsStore.length + 1,
      status: input.status || "ACTIVE",
      isActive: (input.status || "ACTIVE") === "ACTIVE",
      overCapacity: false,
      statusHistory: [
        {
          id: `dsh00000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
          departmentId: newId,
          oldStatus: "INACTIVE",
          newStatus: input.status || "ACTIVE",
          reason: "Initial department registration and establishment",
          changedBy: currentUser.id,
          changedByName: `${currentUser.email} (${currentUser.role})`,
          changedAt: new Date().toISOString(),
        },
      ],
      capacityHistory: [
        {
          id: `dch00000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
          departmentId: newId,
          campusId: input.campusId,
          previousCapacity: 0,
          newCapacity: input.capacity,
          changedBy: currentUser.id,
          changedByName: `${currentUser.email} (${currentUser.role})`,
          changeReason: "Initial department capacity initialization",
          confirmationRequired: false,
          confirmationGiven: true,
          changedAt: new Date().toISOString(),
        },
      ],
      eligibilityRules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    departmentsStore.push(newDept);
    return newDept;
  }

  /**
   * Update department metadata
   */
  static async update(
    id: string,
    input: UpdateDepartmentInput,
    currentUser: AuthSessionPayload
  ): Promise<{ department: DepartmentRecord; warning?: string }> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can modify department settings");
    }

    const dept = departmentsStore.find((d) => d.id === id);
    if (!dept) {
      throw new Error("Department not found");
    }

    let warning: string | undefined;

    // Business Rule 4: Department capacity reduction warning & preserve existing allocations
    if (input.capacity !== undefined && input.capacity < dept.capacity) {
      if (input.capacity < dept.allocatedMembersCount) {
        warning = `Warning: New capacity (${input.capacity}) is lower than currently allocated members (${dept.allocatedMembersCount}). Existing member assignments are strictly preserved.`;
      }
    }

    if (input.name !== undefined) dept.name = input.name.trim();
    if (input.description !== undefined) dept.description = input.description.trim();
    if (input.capacity !== undefined) {
      dept.capacity = input.capacity;
      dept.overCapacity = dept.allocatedMembersCount > dept.capacity;
    }
    if (input.targetPercentage !== undefined) dept.targetPercentage = input.targetPercentage;
    if (input.priority !== undefined) dept.priority = input.priority;
    if (input.status !== undefined) {
      dept.status = input.status;
      dept.isActive = input.status === "ACTIVE";
    } else if (input.isActive !== undefined) {
      dept.isActive = input.isActive;
      dept.status = input.isActive ? "ACTIVE" : "INACTIVE";
    }
    dept.updatedAt = new Date().toISOString();

    return { department: dept, warning };
  }

  /**
   * Change Department Status with required reason and status history audit log
   */
  static async changeStatus(
    id: string,
    input: ChangeDepartmentStatusInput,
    currentUser: AuthSessionPayload
  ): Promise<DepartmentRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can transition department lifecycle status");
    }

    const dept = departmentsStore.find((d) => d.id === id);
    if (!dept) {
      throw new Error("Department not found");
    }

    const oldStatus = dept.status;
    const newStatus = input.status;

    if (oldStatus === newStatus) {
      return dept;
    }

    dept.status = newStatus;
    dept.isActive = newStatus === "ACTIVE";
    dept.updatedAt = new Date().toISOString();

    const historyEntry: DepartmentStatusHistoryRecord = {
      id: `dsh00000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      departmentId: dept.id,
      oldStatus,
      newStatus,
      reason: input.reason.trim(),
      changedBy: currentUser.id,
      changedByName: `${currentUser.email} (${currentUser.role})`,
      changedAt: new Date().toISOString(),
    };

    dept.statusHistory.unshift(historyEntry);
    return dept;
  }

  /**
   * Update Department Capacity with validation and confirmation requirement
   */
  static async updateCapacity(
    id: string,
    input: UpdateDepartmentCapacityInput,
    currentUser: AuthSessionPayload
  ): Promise<{
    department: DepartmentRecord;
    requiresConfirmation?: boolean;
    shortfall?: number;
    message: string;
  }> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can adjust department capacity");
    }

    const dept = departmentsStore.find((d) => d.id === id);
    if (!dept) {
      throw new Error("Department not found");
    }

    const prevCapacity = dept.capacity;
    const newCapacity = input.capacity;
    const currentAllocated = dept.allocatedMembersCount;

    // Check if new capacity is lower than current allocations
    if (newCapacity < currentAllocated) {
      const shortfall = currentAllocated - newCapacity;
      if (!input.confirmation) {
        return {
          department: dept,
          requiresConfirmation: true,
          shortfall,
          message: `Confirmation required: New capacity (${newCapacity}) is less than current allocated members (${currentAllocated}). A shortfall of ${shortfall} seats will occur. Existing member allocations will be preserved.`,
        };
      }
    }

    dept.capacity = newCapacity;
    dept.overCapacity = currentAllocated > newCapacity;
    dept.updatedAt = new Date().toISOString();

    const historyEntry: DepartmentCapacityHistoryRecord = {
      id: `dch00000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      departmentId: dept.id,
      campusId: dept.campusId,
      previousCapacity: prevCapacity,
      newCapacity,
      changedBy: currentUser.id,
      changedByName: `${currentUser.email} (${currentUser.role})`,
      changeReason: input.reason || "Administrative capacity adjustment",
      confirmationRequired: newCapacity < currentAllocated,
      confirmationGiven: input.confirmation || false,
      changedAt: new Date().toISOString(),
    };

    dept.capacityHistory.unshift(historyEntry);

    return {
      department: dept,
      message:
        dept.overCapacity
          ? `Capacity updated to ${newCapacity}. Department is currently flagged as OVER CAPACITY with ${currentAllocated} allocated members.`
          : `Capacity updated to ${newCapacity} successfully.`,
    };
  }

  /**
   * Toggle Active (backward compatible shortcut)
   */
  static async toggleActive(
    id: string,
    currentUser: AuthSessionPayload
  ): Promise<DepartmentRecord> {
    const dept = departmentsStore.find((d) => d.id === id);
    if (!dept) {
      throw new Error("Department not found");
    }

    const nextStatus: DepartmentStatus = dept.isActive ? "INACTIVE" : "ACTIVE";
    return this.changeStatus(
      id,
      {
        status: nextStatus,
        reason: `Quick toggle to ${nextStatus}`,
      },
      currentUser
    );
  }

  /**
   * Delete Department with member allocation safeguard
   */
  static async delete(id: string, currentUser: AuthSessionPayload): Promise<boolean> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can remove departments");
    }

    const dept = departmentsStore.find((d) => d.id === id);
    if (!dept) {
      throw new Error("Department not found");
    }

    if (dept.allocatedMembersCount > 0) {
      throw new Error(
        `Cannot delete department "${dept.name}" because it currently has ${dept.allocatedMembersCount} allocated members. Reassign members first.`
      );
    }

    departmentsStore = departmentsStore.filter((d) => d.id !== id);
    return true;
  }

  /**
   * Real-time Department Dashboard Summary KPI Metrics
   */
  static async getDashboardSummary(
    campusId?: string,
    currentUser?: AuthSessionPayload
  ): Promise<DepartmentDashboardSummary> {
    const list = await this.getAll(campusId, currentUser);

    const totalDepartments = list.length;
    const activeDepartments = list.filter((d) => d.status === "ACTIVE").length;
    const inactiveDepartments = list.filter((d) => d.status === "INACTIVE").length;
    const archivedDepartments = list.filter((d) => d.status === "ARCHIVED").length;

    let nearCapacityCount = 0;
    let overCapacityCount = 0;
    let totalCapacity = 0;
    let totalAllocated = 0;

    for (const d of list) {
      totalCapacity += d.capacity;
      totalAllocated += d.allocatedMembersCount;
      const util = d.capacity > 0 ? (d.allocatedMembersCount / d.capacity) * 100 : 0;
      if (util >= 100 || d.allocatedMembersCount > d.capacity) {
        overCapacityCount++;
      } else if (util >= 80) {
        nearCapacityCount++;
      }
    }

    const overallUtilization =
      totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

    const activeDepts = list.filter((d) => d.isActive);
    const sum = activeDepts.reduce((acc, d) => acc + d.targetPercentage, 0);
    const currentTargetSum = Math.round(sum * 100) / 100;
    const isTargetSumValid = Math.abs(currentTargetSum - 100) < 0.01;

    const currentConfig = targetConfigurationsStore.find(
      (tc) => (!campusId || tc.campusId === campusId) && tc.isActive
    );

    return {
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      archivedDepartments,
      nearCapacityCount,
      overCapacityCount,
      totalCapacity,
      totalAllocated,
      overallUtilization,
      isTargetConfigured: Boolean(currentConfig),
      isTargetSumValid,
      currentTargetSum,
      currentTargetCycleName: currentConfig ? currentConfig.cycleName : "Default Cycle",
    };
  }

  // ==========================================
  // PERCENTAGE TARGETS STUDIO & VALIDATION
  // ==========================================

  static async getCurrentTargetConfiguration(
    campusId: string
  ): Promise<TargetConfigurationRecord | null> {
    const config = targetConfigurationsStore.find(
      (tc) => tc.campusId === campusId && tc.isActive
    );
    return config || null;
  }

  static async getTargetHistory(campusId: string): Promise<TargetConfigurationRecord[]> {
    return targetConfigurationsStore
      .filter((tc) => tc.campusId === campusId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Validate percentage targets:
   * 1. Decimal-safe sum === 100.00%
   * 2. Integer projection via Largest Remainder (when sum is valid)
   * 3. Checks for capacity shortfalls (projected target > department capacity)
   */
  static async validateTargets(
    campusId: string,
    input: ValidateTargetsInput
  ): Promise<{
    isValid: boolean;
    sum: number;
    difference: number;
    projectedAllocations: CalculatedDepartmentTarget[];
    shortfalls: {
      departmentId: string;
      departmentCode: string;
      departmentName: string;
      capacity: number;
      projectedTarget: number;
      shortfall: number;
    }[];
    message: string;
  }> {
    const sum = input.targets.reduce((acc, t) => acc + t.percentage, 0);
    const roundedSum = Math.round(sum * 100) / 100;
    const difference = Math.round((100 - roundedSum) * 100) / 100;
    const isSumValid = Math.abs(roundedSum - 100) < 0.01;

    const campusDepts = departmentsStore.filter((d) => d.campusId === campusId && d.isActive);

    const shareInputs = input.targets.map((t) => {
      const dept = campusDepts.find((d) => d.id === t.departmentId);
      return {
        departmentId: t.departmentId,
        departmentCode: dept ? dept.code : "UNKNOWN",
        departmentName: dept ? dept.name : "Unknown Department",
        percentage: t.percentage,
      };
    });

    const totalBaseCount = input.totalBaseCount || 1000;
    let projectedAllocations: CalculatedDepartmentTarget[] = [];
    const shortfalls: {
      departmentId: string;
      departmentCode: string;
      departmentName: string;
      capacity: number;
      projectedTarget: number;
      shortfall: number;
    }[] = [];

    if (isSumValid) {
      try {
        const result = calculateLargestRemainderTargets(totalBaseCount, shareInputs);
        projectedAllocations = result.targets;

        for (const p of projectedAllocations) {
          const dept = campusDepts.find((d) => d.id === p.departmentId);
          if (dept && p.targetCount > dept.capacity) {
            shortfalls.push({
              departmentId: dept.id,
              departmentCode: dept.code,
              departmentName: dept.name,
              capacity: dept.capacity,
              projectedTarget: p.targetCount,
              shortfall: p.targetCount - dept.capacity,
            });
          }
        }
      } catch {
        // If calculation fails, projectedAllocations remains empty
      }
    }

    let message = "Targets are valid and sum to 100.00%.";
    if (!isSumValid) {
      message = `Target percentages sum to ${roundedSum}%. Exactly 100.00% is required.`;
    } else if (shortfalls.length > 0) {
      message = `Warning: ${shortfalls.length} department(s) exceed their maximum capacity limit under a base population of ${totalBaseCount}.`;
    }

    return {
      isValid: isSumValid && shortfalls.length === 0,
      sum: roundedSum,
      difference,
      projectedAllocations,
      shortfalls,
      message,
    };
  }

  /**
   * Finalize and lock target configuration (Immutable Snapshot Versioning)
   */
  static async finalizeTargets(
    input: FinalizeTargetsInput,
    currentUser: AuthSessionPayload
  ): Promise<TargetConfigurationRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can finalize percentage target configurations");
    }

    // Step 1: Validate sum
    const validation = await this.validateTargets(input.campusId, {
      campusId: input.campusId,
      cycleName: input.cycleName,
      targets: input.targets,
      totalBaseCount: input.totalBaseCount || 1000,
    });

    if (Math.abs(validation.sum - 100) > 0.01) {
      throw new Error(
        `Department targets must sum to exactly 100.00%. Current sum: ${validation.sum}%`
      );
    }

    // Step 2: Capacity shortfall safety check (Business Rule 5)
    if (validation.shortfalls.length > 0 && !input.confirmShortfalls) {
      const details = validation.shortfalls
        .map((s) => `${s.departmentCode} (Cap: ${s.capacity}, Target: ${s.projectedTarget})`)
        .join("; ");
      throw new Error(
        `Capacity Shortfall: Target allocation exceeds department capacity for: ${details}. Please increase department capacity or confirm override.`
      );
    }

    // Step 3: Deactivate existing active configurations for this campus
    const existingCampusConfigs = targetConfigurationsStore.filter(
      (tc) => tc.campusId === input.campusId
    );
    existingCampusConfigs.forEach((tc) => {
      tc.isActive = false;
    });

    const nextVersion = existingCampusConfigs.length + 1;

    // Step 4: Update active target percentages on departments
    for (const t of input.targets) {
      const dept = departmentsStore.find((d) => d.id === t.departmentId);
      if (dept) {
        dept.targetPercentage = t.percentage;
        dept.updatedAt = new Date().toISOString();
      }
    }

    // Step 5: Create immutable versioned configuration record
    const newConfig: TargetConfigurationRecord = {
      id: `tc000000-0000-0000-0000-${(targetConfigurationsStore.length + 1)
        .toString()
        .padStart(12, "0")}`,
      campusId: input.campusId,
      cycleName: input.cycleName.trim(),
      targets: input.targets,
      projectedAllocations: validation.projectedAllocations,
      isActive: true,
      version: nextVersion,
      finalizedBy: currentUser.id,
      finalizedByName: `${currentUser.email} (${currentUser.role})`,
      createdAt: new Date().toISOString(),
    };

    targetConfigurationsStore.push(newConfig);
    return newConfig;
  }

  /**
   * Run simulation of Largest Remainder Method for a given member population
   */
  static async simulateTargets(
    campusId: string,
    totalMembers: number
  ): Promise<{ totalAllocatedTarget: number; targets: CalculatedDepartmentTarget[] }> {
    const activeDepts = departmentsStore.filter(
      (d) => d.campusId === campusId && d.isActive
    );

    if (activeDepts.length === 0) {
      throw new Error("No active departments found for the specified campus");
    }

    const shareInputs = activeDepts.map((d) => ({
      departmentId: d.id,
      departmentCode: d.code,
      departmentName: d.name,
      percentage: d.targetPercentage,
    }));

    return calculateLargestRemainderTargets(totalMembers, shareInputs);
  }

  // ==========================================
  // ELIGIBILITY RULES MANAGEMENT (MODULES 2 & 5)
  // ==========================================

  static async getEligibilityRules(departmentId: string): Promise<EligibilityRuleRecord[]> {
    const dept = departmentsStore.find((d) => d.id === departmentId);
    if (!dept) {
      throw new Error("Department not found");
    }
    return dept.eligibilityRules || [];
  }

  static async saveEligibilityRules(
    departmentId: string,
    rules: EligibilityRuleInput[],
    currentUser: AuthSessionPayload
  ): Promise<EligibilityRuleRecord[]> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can configure eligibility rules");
    }

    const dept = departmentsStore.find((d) => d.id === departmentId);
    if (!dept) {
      throw new Error("Department not found");
    }

    const savedRules: EligibilityRuleRecord[] = rules.map((r, idx) => ({
      id: r.id || `er000000-0000-0000-0000-${(idx + 1).toString().padStart(12, "0")}`,
      departmentId,
      ruleName: r.ruleName.trim(),
      ruleType: r.ruleType,
      operator: r.operator,
      value: r.value,
      isMandatory: r.isMandatory !== undefined ? r.isMandatory : true,
      isActive: r.isActive !== undefined ? r.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    dept.eligibilityRules = savedRules;
    dept.updatedAt = new Date().toISOString();

    return savedRules;
  }

  // ==========================================
  // DEPARTMENT-WISE MEMBER DISPLAY (MODULE 10)
  // ==========================================

  static async getDepartmentRoster(
    departmentId: string,
    filter: {
      search?: string;
      gender?: string;
      category?: string;
      spiritualStatus?: string;
      page?: number;
      limit?: number;
    },
    currentUser: AuthSessionPayload
  ) {
    const dept = await this.getById(departmentId);
    if (!dept) {
      throw new Error("Department not found");
    }

    const { members, pagination } = await MemberService.getAll(
      {
        departmentId,
        search: filter.search,
        gender: filter.gender as any,
        category: filter.category as any,
        spiritualStatus: filter.spiritualStatus as any,
        page: filter.page || 1,
        limit: filter.limit || 20,
      },
      currentUser
    );

    const { members: allDeptMembers } = await MemberService.getAll(
      {
        departmentId,
        limit: 10000,
      },
      currentUser
    );

    const totalAllocated = allDeptMembers.length;
    dept.allocatedMembersCount = Math.max(dept.allocatedMembersCount, totalAllocated);

    const remainingCapacity = Math.max(0, dept.capacity - dept.allocatedMembersCount);
    const capacityUtilization =
      dept.capacity > 0 ? Math.round((dept.allocatedMembersCount / dept.capacity) * 100) : 0;

    const menCount = allDeptMembers.filter((m) => m.gender === "MALE").length;
    const womenCount = allDeptMembers.filter((m) => m.gender === "FEMALE").length;
    const deaconsCount = allDeptMembers.filter((m) => m.spiritualStatus === "DEACON").length;
    const servantsCount = allDeptMembers.filter((m) => m.spiritualStatus === "SERVANT").length;
    const regularCount = allDeptMembers.filter((m) => m.spiritualStatus === "REGULAR").length;
    const activeCount = allDeptMembers.filter((m) => m.status === "ACTIVE").length;

    let ssSenior = 0;
    let ssMid = 0;
    let ssJunior = 0;
    let ssTotal = 0;

    for (const m of allDeptMembers) {
      const d = m.sundaySchoolDuration || "";
      if (d && d !== "—" && d.trim() !== "") {
        ssTotal++;
        const match = d.match(/(\d+)/);
        const years = match ? parseInt(match[1], 10) : 0;
        if (
          years >= 5 ||
          d.includes("5") ||
          d.includes("6") ||
          d.includes("7") ||
          d.includes("8") ||
          d.includes("9") ||
          d.includes("10")
        ) {
          ssSenior++;
        } else if (years >= 3 || d.includes("3") || d.includes("4")) {
          ssMid++;
        } else {
          ssJunior++;
        }
      }
    }

    const totalAge = allDeptMembers.reduce((sum, m) => sum + (m.age || 21), 0);
    const averageAge = allDeptMembers.length > 0 ? Math.round(totalAge / allDeptMembers.length) : 0;

    return {
      department: {
        id: dept.id,
        campusId: dept.campusId,
        code: dept.code,
        name: dept.name,
        description: dept.description,
        capacity: dept.capacity,
        targetPercentage: dept.targetPercentage,
        allocatedMembersCount: dept.allocatedMembersCount,
        remainingCapacity,
        capacityUtilization,
      },
      analytics: {
        totalAllocated: dept.allocatedMembersCount,
        menCount,
        womenCount,
        menPercentage: totalAllocated > 0 ? Math.round((menCount / totalAllocated) * 100) : 0,
        womenPercentage: totalAllocated > 0 ? Math.round((womenCount / totalAllocated) * 100) : 0,
        deaconsCount,
        servantsCount,
        regularCount,
        activeCount,
        sundaySchoolTotal: ssTotal,
        sundaySchoolSenior: ssSenior,
        sundaySchoolMid: ssMid,
        sundaySchoolJunior: ssJunior,
        averageAge,
      },
      members,
      pagination,
    };
  }

  /**
   * Export department roster to Excel (.xlsx)
   */
  static async exportDepartmentRosterExcel(
    departmentId: string,
    currentUser: AuthSessionPayload
  ): Promise<Buffer> {
    const dept = await this.getById(departmentId);
    if (!dept) {
      throw new Error("Department not found");
    }

    const { members } = await MemberService.getAll(
      { departmentId, limit: 50000 },
      currentUser
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "C-CIMAS";
    const sheet = workbook.addWorksheet(`${dept.code} Official Roster`);

    sheet.columns = [
      { header: "ተ.ቁ (Member ID)", key: "memberId", width: 18 },
      { header: "ሙሉ ስም (Full Name)", key: "fullName", width: 25 },
      { header: "ክርስትና ስም (Christian Name)", key: "christianName", width: 20 },
      { header: "ጾታ (Gender)", key: "gender", width: 14 },
      { header: "ስልክ ቁጥር (Phone)", key: "phoneNumber", width: 18 },
      { header: "ዲፓርትመንት (Academic Dept)", key: "academicDepartment", width: 22 },
      { header: "የመጡበት ክልል (Origin Region)", key: "originRegion", width: 18 },
      { header: "ዞን (Zone)", key: "zone", width: 16 },
      { header: "ወረዳ (Woreda)", key: "woreda", width: 16 },
      { header: "ቀበሌ (Kebele)", key: "kebele", width: 14 },
      { header: "ብሎክ (Block)", key: "dormBlock", width: 14 },
      { header: "ዶርም (Dorm)", key: "dormRoom", width: 14 },
      { header: "ቋንቋ (Language)", key: "language", width: 16 },
      { header: "የተጠሪ ስም (Emergency Contact)", key: "emergencyContactName", width: 22 },
      { header: "የተጠሪ ስልክ (Emergency Phone)", key: "emergencyContactPhone", width: 18 },
      { header: "የሰንበት ት/ቤት ቆይታ (Sunday School)", key: "sundaySchoolDuration", width: 22 },
      { header: "ዕድሜ (Age)", key: "age", width: 12 },
      { header: "ሁኔታ (Status)", key: "status", width: 14 },
    ];

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D5B61" },
    };
    header.height = 28;

    members.forEach((m) => {
      sheet.addRow({
        memberId: m.memberId,
        fullName: m.fullName,
        christianName: m.christianName || "—",
        gender: m.gender === "MALE" ? "ወንድ (Male)" : "ሴት (Female)",
        phoneNumber: m.phoneNumber || "—",
        academicDepartment: m.academicDepartment || m.educationLevel || "—",
        originRegion: m.originRegion || "—",
        zone: m.zone || "—",
        woreda: m.woreda || "—",
        kebele: m.kebele || "—",
        dormBlock: m.dormBlock || "—",
        dormRoom: m.dormRoom || "—",
        language: m.language || "አማርኛ",
        emergencyContactName: m.emergencyContactName || m.emergencyContact || "—",
        emergencyContactPhone: m.emergencyContactPhone || "—",
        sundaySchoolDuration: m.sundaySchoolDuration || "—",
        age: m.age || 21,
        status: m.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
