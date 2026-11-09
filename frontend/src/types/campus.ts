export interface Campus {
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
}

export interface CreateCampusPayload {
  code: string;
  name: string;
  city: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}
