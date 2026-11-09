import { Campus, CreateCampusPayload } from "../types/campus";

export async function fetchCampuses(token: string): Promise<Campus[]> {
  const res = await fetch("/api/v1/campuses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch campuses");
  return data.data.campuses;
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
