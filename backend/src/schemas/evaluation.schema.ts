import { z } from "zod";

export const TaskStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "NEEDS_CORRECTION"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const EvaluationStatusEnum = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "CORRECTION_REQUESTED"]);
export type EvaluationStatus = z.infer<typeof EvaluationStatusEnum>;

export const CreateEvaluationTaskSchema = z.object({
  campusId: z.string().min(1, "Campus ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  assignedTo: z.string().min(1, "Evaluator user ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  candidateMemberIds: z.array(z.string().min(1)).min(1, "At least one member must be assigned for evaluation"),
  dueDate: z.string().optional(),
});
export type CreateEvaluationTaskInput = z.infer<typeof CreateEvaluationTaskSchema>;

export const SubmitEvaluationSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  score: z.number().min(0).max(100, "Score must be between 0 and 100"),
  comments: z.string().min(2, "Comments are required"),
  criteriaScores: z.record(z.string(), z.number()).optional(),
  isDraft: z.boolean().default(false),
});
export type SubmitEvaluationInput = z.infer<typeof SubmitEvaluationSchema>;

export const CorrectionRequestSchema = z.object({
  notes: z.string().min(5, "Reason for correction request must be at least 5 characters"),
});
export type CorrectionRequestInput = z.infer<typeof CorrectionRequestSchema>;

export const ApproveEvaluationSchema = z.object({
  notes: z.string().optional(),
});
export type ApproveEvaluationInput = z.infer<typeof ApproveEvaluationSchema>;
