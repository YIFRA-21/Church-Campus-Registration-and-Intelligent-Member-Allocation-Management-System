export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  campusId: string | null;
  campusName: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface RoleDefinition {
  name: string;
  title: string;
  description: string;
  permissions: string[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  campusId?: string | null;
  role: string;
  customPermissions?: string[];
}
