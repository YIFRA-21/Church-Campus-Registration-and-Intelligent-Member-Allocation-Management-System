export type ImportBatchStatus =
  | "uploaded"
  | "mapping_required"
  | "validating"
  | "validation_completed"
  | "pending_review"
  | "ready_for_approval"
  | "approved"
  | "importing"
  | "completed"
  | "completed_with_errors"
  | "rejected"
  | "cancelled";

export type DuplicateReviewDecision =
  | "create_new_member"
  | "update_existing_member"
  | "skip_existing"
  | "reject_row"
  | "needs_more_information";

export interface ImportBatch {
  id: string;
  campusId: string;
  campusName: string;
  fileName: string;
  filePath: string;
  fileType: "csv" | "xlsx";
  fileSize: number;
  fileChecksum: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  pendingReviewRows: number;
  approvedRows: number;
  importedRows: number;
  updatedRows: number;
  failedRows: number;
  status: ImportBatchStatus;
  uploadedBy: string;
  uploadedByName: string;
  reviewedBy?: string;
  reviewedByName?: string;
  approvedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  errors?: any[];
}

export interface ImportColumnMapping {
  id: string;
  batchId: string;
  csvColumnName: string;
  systemFieldName: string;
  columnIndex: number;
  isRequired: boolean;
  mappingStatus: "MAPPED" | "IGNORED";
  createdAt: string;
}

export interface ImportValidationError {
  id: string;
  batchId: string;
  importRowId: string;
  rowNumber: number;
  fieldName: string;
  errorCode: string;
  errorMessage: string;
  severity: "error" | "warning";
  createdAt: string;
}

export interface ImportDuplicateCandidate {
  id: string;
  batchId: string;
  importRowId: string;
  rowNumber: number;
  existingMemberId: string;
  existingMember: {
    id: string;
    memberId: string;
    fullName: string;
    christianName?: string;
    gender: string;
    phoneNumber?: string;
    academicDepartment?: string;
    campusId: string;
  };
  stagedRow?: {
    rowNumber: number;
    fullName: string;
    christianName?: string;
    gender: string;
    phoneNumber?: string;
    academicDepartment?: string;
    region?: string;
    age?: number;
  };
  matchScore: number;
  matchingFields: string[];
  matchReason: string;
  reviewStatus: "pending" | "approved_create" | "approved_update" | "skip_existing" | "rejected" | "needs_more_information";
  reviewedBy?: string;
  reviewedAt?: string;
  decisionReason?: string;
  createdAt: string;
}

export interface ImportRow {
  id: string;
  batchId: string;
  campusId: string;
  rowNumber: number;
  originalData: Record<string, string>;
  normalizedData: {
    serialNumber?: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    christianName?: string;
    gender: "MALE" | "FEMALE";
    phoneNumber?: string;
    email?: string;
    academicDepartment?: string;
    originRegion?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    dormBlock?: string;
    dormRoom?: string;
    language?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    sundaySchoolDuration?: string;
    age?: number;
  };
  validationStatus: "pending" | "valid" | "invalid";
  duplicateStatus: "not_checked" | "no_duplicate" | "possible_duplicate" | "confirmed_duplicate";
  reviewStatus: "not_required" | "pending" | "approved_create" | "approved_update" | "rejected" | "needs_more_information";
  importStatus: "pending" | "processing" | "imported" | "updated" | "failed" | "skipped";
  matchedMemberId?: string | null;
  createdMemberId?: string | null;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchUploadResponse {
  batch: ImportBatch;
  suggestedMappings: Record<string, string>;
  sampleRows: Record<string, string>[];
}

export interface ValidationResultsResponse {
  batchId: string;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    pendingReviewRows: number;
  };
  errors: ImportValidationError[];
}

export interface DuplicateCandidatesResponse {
  batchId: string;
  totalPendingReviews: number;
  candidates: ImportDuplicateCandidate[];
}
