import {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  DepartmentStatus,
  TargetConfiguration,
  TargetValidationResult,
  TargetSimulationResult,
  DepartmentDashboardSummary,
  EligibilityRule,
} from "../types/department";

export async function fetchDepartmentDashboardSummary(
  token: string,
  campusId?: string
): Promise<DepartmentDashboardSummary> {
  const url = campusId
    ? `/api/v1/departments/dashboard/summary?campusId=${campusId}`
    : "/api/v1/departments/dashboard/summary";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch dashboard summary");
  return data.data.summary;
}

export function fetchDepartments(
  token: string,
  campusId?: string
): Promise<Department[]>;

export function fetchDepartments(
  token: string,
  params: {
    campusId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<{
  departments: Department[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

export async function fetchDepartments(
  token: string,
  campusIdOrParams?:
    | string
    | {
        campusId?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
): Promise<any> {
  const query = new URLSearchParams();
  const isStringParam = typeof campusIdOrParams === "string" || campusIdOrParams === undefined;

  if (typeof campusIdOrParams === "string") {
    if (campusIdOrParams) query.append("campusId", campusIdOrParams);
  } else if (campusIdOrParams) {
    if (campusIdOrParams.campusId) query.append("campusId", campusIdOrParams.campusId);
    if (campusIdOrParams.status && campusIdOrParams.status !== "ALL") {
      query.append("status", campusIdOrParams.status);
    }
    if (campusIdOrParams.search) query.append("search", campusIdOrParams.search);
    if (campusIdOrParams.page) query.append("page", campusIdOrParams.page.toString());
    if (campusIdOrParams.limit) query.append("limit", campusIdOrParams.limit.toString());
    if (campusIdOrParams.sortBy) query.append("sortBy", campusIdOrParams.sortBy);
    if (campusIdOrParams.sortOrder) query.append("sortOrder", campusIdOrParams.sortOrder);
  }

  const qs = query.toString();
  const url = qs ? `/api/v1/departments?${qs}` : "/api/v1/departments";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch departments");

  if (isStringParam) {
    return data.data.departments;
  }
  return data.data;
}

export async function fetchDepartmentById(id: string, token: string): Promise<Department> {
  const res = await fetch(`/api/v1/departments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch department");
  return data.data.department;
}

export async function createDepartment(
  payload: CreateDepartmentPayload,
  token: string
): Promise<Department> {
  const res = await fetch("/api/v1/departments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create department");
  return data.data.department;
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload,
  token: string
): Promise<{ department: Department; warning?: string }> {
  const res = await fetch(`/api/v1/departments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update department");
  return data.data;
}

export async function changeDepartmentStatus(
  id: string,
  status: DepartmentStatus,
  reason: string,
  token: string
): Promise<Department> {
  const res = await fetch(`/api/v1/departments/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change department status");
  return data.data.department;
}

export async function updateDepartmentCapacity(
  id: string,
  capacity: number,
  reason: string,
  confirmation: boolean,
  token: string
): Promise<{
  department: Department;
  requiresConfirmation?: boolean;
  shortfall?: number;
  message: string;
}> {
  const res = await fetch(`/api/v1/departments/${id}/capacity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ capacity, reason, confirmation }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to adjust department capacity");
  return {
    department: data.data?.department,
    requiresConfirmation: data.requiresConfirmation,
    shortfall: data.shortfall,
    message: data.message,
  };
}

export async function toggleDepartmentActive(id: string, token: string): Promise<Department> {
  const res = await fetch(`/api/v1/departments/${id}/toggle-active`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to toggle department status");
  return data.data.department;
}

export async function deleteDepartment(id: string, token: string): Promise<void> {
  const res = await fetch(`/api/v1/departments/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete department");
}

// Target Configuration Studio APIs
export async function fetchCurrentTargetConfiguration(
  campusId: string,
  token: string
): Promise<TargetConfiguration | null> {
  const res = await fetch(`/api/v1/departments/targets/current?campusId=${campusId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch target configuration");
  return data.data.configuration;
}

export async function fetchTargetHistory(
  campusId: string,
  token: string
): Promise<TargetConfiguration[]> {
  const res = await fetch(`/api/v1/departments/targets/history?campusId=${campusId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch target history");
  return data.data.history;
}

export async function validateTargets(
  payload: {
    campusId: string;
    cycleName?: string;
    targets: { departmentId: string; percentage: number }[];
    totalBaseCount?: number;
  },
  token: string
): Promise<TargetValidationResult> {
  const res = await fetch("/api/v1/departments/targets/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Target validation failed");
  return data.data;
}

export async function finalizeTargets(
  payload: {
    campusId: string;
    cycleName: string;
    targets: { departmentId: string; percentage: number }[];
    totalBaseCount?: number;
    confirmShortfalls?: boolean;
  },
  token: string
): Promise<TargetConfiguration> {
  const res = await fetch("/api/v1/departments/targets/finalize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to finalize percentage targets");
  return data.data.configuration;
}

export async function simulateTargets(
  campusId: string,
  totalMembers: number,
  token: string
): Promise<TargetSimulationResult> {
  const res = await fetch("/api/v1/departments/targets/simulate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ campusId, totalMembers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Target simulation failed");
  return data.data;
}

// Eligibility Rules APIs (Modules 2 & 5)
export async function fetchEligibilityRules(
  departmentId: string,
  token: string
): Promise<EligibilityRule[]> {
  const res = await fetch(`/api/v1/departments/${departmentId}/eligibility-rules`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch eligibility rules");
  return data.data.rules;
}

export async function saveEligibilityRules(
  departmentId: string,
  rules: EligibilityRule[],
  token: string
): Promise<EligibilityRule[]> {
  const res = await fetch(`/api/v1/departments/${departmentId}/eligibility-rules`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rules }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to save eligibility rules");
  return data.data.rules;
}

// Department Roster & Export (Module 10)
export async function fetchDepartmentRoster(
  departmentId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    gender?: string;
    category?: string;
    spiritualStatus?: string;
  },
  token: string
) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.gender) query.append("gender", params.gender);
  if (params.category) query.append("category", params.category);
  if (params.spiritualStatus) query.append("spiritualStatus", params.spiritualStatus);

  const res = await fetch(`/api/v1/departments/${departmentId}/roster?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch department roster");
  return data.data;
}

export async function exportDepartmentRosterExcel(
  departmentId: string,
  departmentCode: string,
  token: string
) {
  const res = await fetch(`/api/v1/departments/${departmentId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to export department roster");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `C-CIMAS-${departmentCode}-Roster.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
