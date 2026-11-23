import {
  ImportBatch,
  BatchUploadResponse,
  ValidationResultsResponse,
  DuplicateCandidatesResponse,
  ImportRow,
  DuplicateReviewDecision,
} from "../types/import";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

/**
 * Downloads official CSV template with UTF-8 BOM and bilingual headers
 */
export async function downloadCsvTemplate(token: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/imports/template/csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to download CSV template");
  }
  return response.blob();
}

/**
 * Downloads legacy Excel template
 */
export async function downloadExcelTemplate(token: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/imports/template`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to download Excel template");
  }
  return response.blob();
}

/**
 * Uploads CSV file (strictly CSV enforced, SHA-256 hashed, stored privately)
 */
export async function uploadCsvFile(
  campusId: string,
  fileName: string,
  fileBase64: string,
  token: string
): Promise<BatchUploadResponse> {
  const response = await fetch(`${BASE_URL}/imports/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ campusId, fileName, fileBase64 }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "CSV upload failed");
  }
  return data.data;
}

/**
 * Retrieves batch import history (all or filtered by campus)
 */
export async function fetchImportHistory(
  token: string,
  campusId?: string
): Promise<ImportBatch[]> {
  const url = campusId
    ? `${BASE_URL}/imports/history?campusId=${encodeURIComponent(campusId)}`
    : `${BASE_URL}/imports/history`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch import history");
  }
  return data.data.history;
}

/**
 * Retrieves detailed batch by ID
 */
export async function fetchBatchById(
  batchId: string,
  token: string
): Promise<ImportBatch> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch batch details");
  }
  return data.data.batch;
}

/**
 * Retrieves column mapping preview and sample rows
 */
export async function fetchBatchPreview(
  batchId: string,
  token: string
): Promise<{
  batch: ImportBatch;
  mappings: any[];
  sampleRows: Record<string, string>[];
  previewRows?: any[];
}> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/preview`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch batch preview");
  }
  return data.data;
}

/**
 * Saves column mappings and triggers batch validation
 */
export async function saveColumnMappings(
  batchId: string,
  mappings: { csvColumn: string; targetField: string }[],
  token: string
): Promise<ImportBatch> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/mapping`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mappings }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to save column mappings");
  }
  return data.data.batch;
}

/**
 * Runs validation on batch
 */
export async function runBatchValidation(
  batchId: string,
  token: string
): Promise<ImportBatch> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/validate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Validation execution failed");
  }
  return data.data.batch;
}

/**
 * Retrieves validation error breakdown and summary
 */
export async function fetchValidationResults(
  batchId: string,
  token: string,
  severity?: string
): Promise<ValidationResultsResponse> {
  const url = severity
    ? `${BASE_URL}/imports/${batchId}/validation-results?severity=${encodeURIComponent(severity)}`
    : `${BASE_URL}/imports/${batchId}/validation-results`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch validation results");
  }
  return data.data;
}

/**
 * Retrieves duplicate candidates requiring Administrator review
 */
export async function fetchDuplicateCandidates(
  batchId: string,
  token: string
): Promise<DuplicateCandidatesResponse> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/duplicates`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch duplicate candidates");
  }
  return data.data;
}

/**
 * Submits an Administrator review decision for a duplicate candidate
 */
export async function submitDuplicateReview(
  batchId: string,
  candidateId: string,
  decision: DuplicateReviewDecision,
  reason: string,
  token: string,
  selectedMemberId?: string | null
): Promise<any> {
  const response = await fetch(
    `${BASE_URL}/imports/${batchId}/duplicates/${candidateId}/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        decision,
        reason,
        selectedMemberId: selectedMemberId || undefined,
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to submit review decision");
  }
  return data.data;
}

/**
 * Retrieves staged rows in import_rows
 */
export async function fetchStagedRecords(
  batchId: string,
  token: string,
  status?: string,
  page = 1,
  limit = 50
): Promise<{
  records: ImportRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  let url = `${BASE_URL}/imports/${batchId}/records?page=${page}&limit=${limit}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch staged records");
  }
  return data.data;
}

/**
 * Approves batch for final member creation (strictly blocks if pending duplicate reviews remain)
 */
export async function approveBatch(
  batchId: string,
  notes: string,
  token: string
): Promise<ImportBatch> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Batch approval failed");
  }
  return data.data.batch;
}

/**
 * Processes approved batch: generates new member codes and updates existing members
 */
export async function processApprovedBatch(
  batchId: string,
  token: string
): Promise<ImportBatch> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ batchSize: 100 }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Batch processing failed");
  }
  return data.data.batch;
}

/**
 * Retries failed rows in batch
 */
export async function retryBatchProcessing(
  batchId: string,
  token: string
): Promise<ImportBatch> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/retry`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Retry failed");
  }
  return data.data.batch;
}

/**
 * Downloads the original CSV file
 */
export async function downloadOriginalCsvFile(
  batchId: string,
  fileName: string,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/original-file`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to download original CSV");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Downloads Excel error report spreadsheet
 */
export async function downloadImportErrorReport(
  batchId: string,
  token: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/imports/${batchId}/errors`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to download error report");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `C-CIMAS-Import-Errors-${batchId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
