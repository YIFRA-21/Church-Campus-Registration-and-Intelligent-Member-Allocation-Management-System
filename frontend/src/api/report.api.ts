import {
  DashboardAnalytics,
  DepartmentDistributionReport,
  EvaluatorPerformanceItem,
  AuditLogResponse,
} from "../types/report";

export async function fetchDashboardAnalytics(
  token: string,
  campusId?: string
): Promise<DashboardAnalytics> {
  const url = campusId
    ? `/api/v1/reports/analytics?campusId=${campusId}`
    : "/api/v1/reports/analytics";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch analytics");
  return data.data;
}

export async function fetchDepartmentDistributionReport(
  campusId: string,
  token: string
): Promise<DepartmentDistributionReport> {
  const res = await fetch(`/api/v1/reports/department-distribution?campusId=${campusId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch department distribution report");
  return data.data;
}

export async function fetchEvaluatorPerformanceReport(
  token: string
): Promise<EvaluatorPerformanceItem[]> {
  const res = await fetch("/api/v1/reports/evaluator-performance", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch evaluator performance");
  return data.data.evaluators;
}

export async function exportReportExcel(
  type: "department_distribution" | "evaluator_performance",
  token: string,
  campusId?: string
) {
  const query = new URLSearchParams({ type });
  if (campusId) query.append("campusId", campusId);

  const res = await fetch(`/api/v1/reports/export?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to export official report");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `C-CIMAS-${type}-Report.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchAuditLogs(
  token: string,
  params?: {
    campusId?: string;
    action?: string;
    entityType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<AuditLogResponse> {
  const query = new URLSearchParams();
  if (params?.campusId) query.append("campusId", params.campusId);
  if (params?.action) query.append("action", params.action);
  if (params?.entityType) query.append("entityType", params.entityType);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`/api/v1/reports/audit-logs?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch audit logs");
  return data.data;
}

