import {
  EvaluationTask,
  EvaluationRecord,
  TaskDetailsResponse,
  CreateTaskPayload,
  SubmitEvaluationPayload,
} from "../types/evaluation";

export async function fetchTasks(
  token: string,
  params?: { campusId?: string; status?: string }
): Promise<EvaluationTask[]> {
  const query = new URLSearchParams();
  if (params?.campusId) query.append("campusId", params.campusId);
  if (params?.status) query.append("status", params.status);

  const res = await fetch(`/api/v1/evaluations/tasks?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch evaluation tasks");
  return data.data.tasks;
}

export async function fetchTaskDetails(
  taskId: string,
  token: string
): Promise<TaskDetailsResponse> {
  const res = await fetch(`/api/v1/evaluations/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch task details");
  return data.data;
}

export async function createEvaluationTask(
  payload: CreateTaskPayload,
  token: string
): Promise<EvaluationTask> {
  const res = await fetch("/api/v1/evaluations/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create evaluation task");
  return data.data.task;
}

export async function submitEvaluation(
  payload: SubmitEvaluationPayload,
  token: string
): Promise<EvaluationRecord> {
  const res = await fetch("/api/v1/evaluations/assessments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to save evaluation");
  return data.data.evaluation;
}

export async function requestEvaluationCorrection(
  evaluationId: string,
  notes: string,
  token: string
): Promise<EvaluationRecord> {
  const res = await fetch(`/api/v1/evaluations/assessments/${evaluationId}/correction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request correction");
  return data.data.evaluation;
}

export async function approveEvaluationAssessment(
  evaluationId: string,
  notes: string | undefined,
  token: string
): Promise<EvaluationRecord> {
  const res = await fetch(`/api/v1/evaluations/assessments/${evaluationId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve evaluation");
  return data.data.evaluation;
}

export async function fetchEvaluationHistory(token: string): Promise<EvaluationRecord[]> {
  const res = await fetch("/api/v1/evaluations/history", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch evaluation history");
  return data.data.history;
}

