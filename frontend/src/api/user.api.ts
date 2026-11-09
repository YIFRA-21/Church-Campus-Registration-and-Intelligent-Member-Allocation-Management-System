import { UserItem, RoleDefinition, CreateUserPayload } from "../types/user";

export async function fetchUsers(token: string): Promise<UserItem[]> {
  const res = await fetch("/api/v1/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch users");
  return data.data.users;
}

export async function fetchRoles(token: string): Promise<RoleDefinition[]> {
  const res = await fetch("/api/v1/users/roles", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch roles");
  return data.data.roles;
}

export async function createUser(payload: CreateUserPayload, token: string): Promise<UserItem> {
  const res = await fetch("/api/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create user");
  return data.data.user;
}
