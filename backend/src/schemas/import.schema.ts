import { z } from "zod";

export const ImportBatchStatusEnum = z.enum([
  "uploaded",
  "mapping_required",
  "validating",
  "validation_completed",
  "pending_review",
  "ready_for_approval",
  "approved",
  "importing",
  "completed",
  "completed_with_errors",
  "rejected",
  "cancelled",
]);
export type ImportBatchStatus = z.infer<typeof ImportBatchStatusEnum>;

export const DuplicateReviewDecisionEnum = z.enum([
  "create_new_member",
  "update_existing_member",
  "skip_existing",
  "reject_row",
  "needs_more_information",
]);
export type DuplicateReviewDecision = z.infer<typeof DuplicateReviewDecisionEnum>;

export const UploadCsvSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  fileName: z.string().min(1, "File name is required"),
  fileBase64: z.string().min(1, "File content is required (Base64)"),
});
export type UploadCsvInput = z.infer<typeof UploadCsvSchema>;

export const ColumnMappingItemSchema = z.object({
  csvColumn: z.string().min(1, "Source column name is required"),
  targetField: z.string().min(1, "Target field name is required"),
  columnIndex: z.number().int().nonnegative().optional(),
});

export const SaveColumnMappingsSchema = z.object({
  mappings: z.array(ColumnMappingItemSchema).min(1, "At least one column mapping is required"),
});
export type SaveColumnMappingsInput = z.infer<typeof SaveColumnMappingsSchema>;

export const ReviewDuplicateSchema = z.object({
  decision: DuplicateReviewDecisionEnum,
  selectedMemberId: z.string().uuid("Valid member UUID required").optional().nullable(),
  reason: z.string().min(2, "Review decision reason is required"),
});
export type ReviewDuplicateInput = z.infer<typeof ReviewDuplicateSchema>;

export const ApproveBatchSchema = z.object({
  notes: z.string().optional().default(""),
});
export type ApproveBatchInput = z.infer<typeof ApproveBatchSchema>;

export const ProcessBatchSchema = z.object({
  batchSize: z.number().int().min(1).max(5000).optional().default(100),
});
export type ProcessBatchInput = z.infer<typeof ProcessBatchSchema>;
