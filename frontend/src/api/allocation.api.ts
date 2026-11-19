import {
  AllocationBatch,
  MemberAllocation,
  AllocationException,
  ResolveExceptionPayload,
} from "../types/allocation";

export async function runAllocation(
  payload: { campusId: string; cycleName: string },
  token: string
): Promise<AllocationBatch> {
  const res = await fetch("/api/v1/allocations/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to execute allocation");
  return data.data.batch;
}

export async function fetchAllocationBatches(
  token: string,
  campusId?: string
): Promise<AllocationBatch[]> {
  const url = campusId ? `/api/v1/allocations/batches?campusId=${campusId}` : "/api/v1/allocations/batches";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch allocation batches");
  return data.data.batches;
}

export async function fetchBatchById(
  id: string,
  token: string
): Promise<AllocationBatch> {
  const res = await fetch(`/api/v1/allocations/batches/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch batch details");
  return data.data.batch;
}

export async function fetchBatchAllocations(
  batchId: string,
  token: string
): Promise<MemberAllocation[]> {
  const res = await fetch(`/api/v1/allocations/batches/${batchId}/allocations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch batch allocations");
  return data.data.allocations;
}

export async function fetchBatchExceptions(
  batchId: string,
  status: string | undefined,
  token: string
): Promise<AllocationException[]> {
  const url = status
    ? `/api/v1/allocations/batches/${batchId}/exceptions?status=${status}`
    : `/api/v1/allocations/batches/${batchId}/exceptions`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch batch exceptions");
  return data.data.exceptions;
}

export async function resolveException(
  exceptionId: string,
  payload: ResolveExceptionPayload,
  token: string
): Promise<AllocationException> {
  const res = await fetch(`/api/v1/allocations/exceptions/${exceptionId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to resolve exception");
  return data.data.exception;
}

export async function approveAllocationBatch(
  batchId: string,
  token: string
): Promise<AllocationBatch> {
  const res = await fetch("/api/v1/allocations/approve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ batchId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve allocation batch");
  return data.data.batch;
}

