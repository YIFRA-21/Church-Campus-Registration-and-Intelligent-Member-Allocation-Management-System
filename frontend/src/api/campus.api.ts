import {
  Campus,
  CreateCampusPayload,
  CampusQueryParams,
  CampusDashboardSummary,
  CampusContact,
  CampusStatusHistory,
  CampusStatus,
} from "../types/campus";

export async function fetchCampusDashboardSummary(token: string): Promise<CampusDashboardSummary> {
  const res = await fetch("/api/v1/campuses/dashboard/summary", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch campus dashboard summary");
  return data.data.summary;
}

export async function fetchCampuses(
  token: string,
  params?: CampusQueryParams
): Promise<Campus[]> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);
  if (params?.status && params.status !== "ALL") query.append("status", params.status);
  if (params?.region) query.append("region", params.region);
  if (params?.city) query.append("city", params.city);
  if (params?.sortBy) query.append("sortBy", params.sortBy);
  if (params?.sortOrder) query.append("sortOrder", params.sortOrder);

  const queryString = query.toString();
  const url = queryString ? `/api/v1/campuses?${queryString}` : "/api/v1/campuses";

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch campuses");

  if (data.data?.campuses && Array.isArray(data.data.campuses)) {
    return data.data.campuses;
  }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

export async function fetchCampusById(id: string, token: string): Promise<Campus> {
  const res = await fetch(`/api/v1/campuses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch campus details");
  return data.data.campus;
}

export async function createCampus(payload: CreateCampusPayload, token: string): Promise<Campus> {
  const res = await fetch("/api/v1/campuses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create campus");
  return data.data.campus;
}

export async function updateCampus(
  id: string,
  payload: Partial<CreateCampusPayload>,
  token: string
): Promise<Campus> {
  const res = await fetch(`/api/v1/campuses/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update campus");
  return data.data.campus;
}

export async function changeCampusStatus(
  id: string,
  status: CampusStatus,
  reason: string,
  token: string
): Promise<Campus> {
  const res = await fetch(`/api/v1/campuses/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change campus status");
  return data.data.campus;
}

export async function toggleCampusActive(id: string, token: string): Promise<Campus> {
  const res = await fetch(`/api/v1/campuses/${id}/toggle-active`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to toggle campus status");
  return data.data.campus;
}

export async function fetchCampusContacts(id: string, token: string): Promise<CampusContact[]> {
  const res = await fetch(`/api/v1/campuses/${id}/contacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch campus contacts");
  return data.data.contacts;
}

export async function updateCampusContacts(
  id: string,
  contacts: Partial<CampusContact>[],
  token: string
): Promise<CampusContact[]> {
  const res = await fetch(`/api/v1/campuses/${id}/contacts`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contacts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update campus contacts");
  return data.data.contacts;
}

export async function fetchCampusStatusHistory(
  id: string,
  token: string
): Promise<CampusStatusHistory[]> {
  const res = await fetch(`/api/v1/campuses/${id}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch campus status history");
  return data.data.history;
}

export async function deleteCampus(id: string, token: string): Promise<void> {
  const res = await fetch(`/api/v1/campuses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete campus");
}
