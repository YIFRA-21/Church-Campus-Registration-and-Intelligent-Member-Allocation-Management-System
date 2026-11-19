import { Member } from "./member";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "NEEDS_CORRECTION";
export type EvaluationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "CORRECTION_REQUESTED";

export interface EvaluationTask {
  id: string;
  campusId: string;
  campusName: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  title: string;
  description: string;
  assignedTo: string;
  evaluatorName: string;
  assignedBy: string;
  candidateMemberIds: string[];
  dueDate?: string;
  status: TaskStatus;
  totalCandidates: number;
  completedEvaluationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationRecord {
  id: string;
  taskId: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  comments: string;
  criteriaScores?: Record<string, number>;
  status: EvaluationStatus;
  adminFeedback?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCandidateDetail {
  member: Member;
  evaluation: EvaluationRecord | null;
}

export interface TaskDetailsResponse {
  task: EvaluationTask;
  candidates: TaskCandidateDetail[];
}

export interface CreateTaskPayload {
  campusId: string;
  departmentId: string;
  assignedTo: string;
  title: string;
  description?: string;
  candidateMemberIds: string[];
  dueDate?: string;
}

export interface SubmitEvaluationPayload {
  taskId: string;
  memberId: string;
  score: number;
  comments: string;
  criteriaScores?: Record<string, number>;
  isDraft?: boolean;
}

