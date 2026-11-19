export type CampusStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface CampusContact {
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

export interface CampusStatusHistory {
  id: string;
  campusId: string;
  oldStatus: CampusStatus;
  newStatus: CampusStatus;
  reason: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

export interface Campus {
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
  contacts?: CampusContact[];
  statusHistory?: CampusStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampusPayload {
  code: string;
  name: string;
  description?: string;
  region?: string;
  city: string;
  subCity?: string;
  woreda?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  status?: CampusStatus;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactPosition?: string;
  primaryContactEmail?: string;
}

export interface CampusQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  region?: string;
  city?: string;
  sortBy?: "name" | "code" | "createdAt" | "city" | "status";
  sortOrder?: "asc" | "desc";
}

export interface CampusDashboardSummary {
  totalCampuses: number;
  activeCampuses: number;
  inactiveCampuses: number;
  archivedCampuses: number;
  totalEnrolledMembers: number;
  totalAssignedMinistries: number;
  recentCampuses: Campus[];
  recentStatusChanges: CampusStatusHistory[];
}
