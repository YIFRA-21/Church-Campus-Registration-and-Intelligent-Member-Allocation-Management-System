import {
  Member,
  CreateMemberPayload,
  MemberFilterParams,
  MemberPagination,
  MemberStats,
  MemberStatusHistory,
  MemberDashboardSummary,
  ImportResultSummary,
  ImportBatchHistoryItem,
} from "../types/member";

export async function fetchMemberDashboardSummary(
  token: string,
  campusId?: string
): Promise<MemberDashboardSummary> {
  const url = campusId
    ? `/api/v1/members/dashboard/summary?campusId=${campusId}`
    : "/api/v1/members/dashboard/summary";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch member dashboard summary");
  return data.data.summary;
}

export async function changeMemberStatus(
  id: string,
  status: string,
  reason: string,
  token: string
): Promise<Member> {
  const res = await fetch(`/api/v1/members/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update member status");
  return data.data.member;
}

export async function fetchMemberHistory(
  id: string,
  token: string
): Promise<MemberStatusHistory[]> {
  const res = await fetch(`/api/v1/members/${id}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch member history timeline");
  return data.data.history;
}

export async function archiveMember(
  id: string,
  reason: string,
  token: string
): Promise<Member> {
  const res = await fetch(`/api/v1/members/${id}/archive`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to archive member");
  return data.data.member;
}

export async function fetchMembers(
  token: string,
  params: MemberFilterParams
): Promise<{ members: Member[]; pagination: MemberPagination }> {
  const query = new URLSearchParams();
  if (params.campusId) query.set("campusId", params.campusId);
  if (params.search) query.set("search", params.search);
  if (params.gender) query.set("gender", params.gender);
  if (params.category) query.set("category", params.category);
  if (params.spiritualStatus) query.set("spiritualStatus", params.spiritualStatus);
  if (params.status) query.set("status", params.status);
  if (params.departmentId !== undefined) {
    query.set("departmentId", params.departmentId || "");
  }
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());

  const res = await fetch(`/api/v1/members?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch members");
  return data.data;
}

export async function createMember(payload: CreateMemberPayload, token: string): Promise<Member> {
  const res = await fetch("/api/v1/members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to register member");
  return data.data.member;
}

export async function updateMember(
  id: string,
  payload: Partial<CreateMemberPayload>,
  token: string
): Promise<Member> {
  const res = await fetch(`/api/v1/members/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update member");
  return data.data.member;
}

export async function deleteMember(id: string, token: string): Promise<void> {
  const res = await fetch(`/api/v1/members/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete member");
}

export async function batchUpdateMemberStatus(
  memberIds: string[],
  status: string,
  token: string
): Promise<{ updatedCount: number }> {
  const res = await fetch("/api/v1/members/batch-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ memberIds, status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to batch update member status");
  return data.data;
}

export async function batchDeleteMembers(
  memberIds: string[],
  token: string
): Promise<{ deletedCount: number }> {
  const res = await fetch("/api/v1/members/batch-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ memberIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete selected members");
  return data.data;
}

export async function fetchMemberStats(token: string, campusId?: string): Promise<MemberStats> {
  const url = campusId ? `/api/v1/members/stats?campusId=${campusId}` : "/api/v1/members/stats";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch member statistics");
  return data.data.stats;
}

// --- Import APIs ---

export async function downloadExcelTemplate(token: string): Promise<Blob> {
  const res = await fetch("/api/v1/imports/template", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to download template");
  return res.blob();
}

export async function uploadExcelImport(
  campusId: string,
  fileName: string,
  fileBase64: string,
  token: string
): Promise<ImportResultSummary> {
  const res = await fetch("/api/v1/imports/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ campusId, fileName, fileBase64 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Bulk import failed");
  return data.data;
}

export async function fetchImportHistory(
  token: string,
  campusId?: string
): Promise<ImportBatchHistoryItem[]> {
  const url = campusId ? `/api/v1/imports/history?campusId=${campusId}` : "/api/v1/imports/history";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch import history");
  return data.data.history;
}

export async function downloadErrorReport(batchId: string, token: string): Promise<Blob> {
  const res = await fetch(`/api/v1/imports/batches/${batchId}/errors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to download error report");
  return res.blob();
}

