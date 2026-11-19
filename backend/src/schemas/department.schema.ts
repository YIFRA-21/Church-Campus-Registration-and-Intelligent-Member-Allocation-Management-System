import { z } from "zod";

export const DepartmentStatusEnum = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export type DepartmentStatus = z.infer<typeof DepartmentStatusEnum>;

export const CreateDepartmentSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters")
    .max(50, "Department code must not exceed 50 characters")
    .trim()
    .toUpperCase(),
  name: z.string().min(2, "Department name must be at least 2 characters").trim(),
  description: z.string().optional().default(""),
  capacity: z.number().int().min(1, "Capacity must be at least 1 seat").default(500),
  targetPercentage: z
    .number()
    .min(0, "Percentage must be >= 0")
    .max(100, "Percentage must be <= 100")
    .default(0),
  priority: z.number().int().min(1, "Priority rank must be >= 1").default(1),
  status: DepartmentStatusEnum.default("ACTIVE"),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const UpdateDepartmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters").optional(),
  description: z.string().optional(),
  capacity: z.number().int().min(0, "Capacity must be non-negative").optional(),
  targetPercentage: z.number().min(0).max(100).optional(),
  priority: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  status: DepartmentStatusEnum.optional(),
});

export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;

export const ChangeDepartmentStatusSchema = z.object({
  status: DepartmentStatusEnum,
  reason: z
    .string()
    .min(5, "A meaningful reason (minimum 5 characters) is required for status changes")
    .trim(),
});

export type ChangeDepartmentStatusInput = z.infer<typeof ChangeDepartmentStatusSchema>;

export const UpdateDepartmentCapacitySchema = z.object({
  capacity: z.number().int().min(0, "Capacity must be non-negative"),
  reason: z.string().optional().default("Routine capacity adjustment"),
  confirmation: z.boolean().optional().default(false),
});

export type UpdateDepartmentCapacityInput = z.infer<typeof UpdateDepartmentCapacitySchema>;

export const TargetItemSchema = z.object({
  departmentId: z.string().uuid("Valid Department UUID required"),
  percentage: z.number().min(0, "Target % must be >= 0").max(100, "Target % must be <= 100"),
});

export type TargetItemInput = z.infer<typeof TargetItemSchema>;

export const ConfigureTargetsSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  cycleName: z.string().min(2, "Allocation cycle name required").trim(),
  targets: z
    .array(TargetItemSchema)
    .min(1, "At least one department target required")
    .refine(
      (items) => {
        const sum = items.reduce((acc, curr) => acc + curr.percentage, 0);
        return Math.abs(Math.round(sum * 100) / 100 - 100) < 0.01;
      },
      {
        message: "Department percentage targets must sum to exactly 100.00%",
      }
    ),
  totalBaseCount: z.number().int().positive().optional(),
});

export type ConfigureTargetsInput = z.infer<typeof ConfigureTargetsSchema>;

export const ValidateTargetsSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  cycleName: z.string().optional().default("Simulated Cycle"),
  targets: z.array(TargetItemSchema).min(1, "At least one target required"),
  totalBaseCount: z.number().int().positive().optional().default(1000),
});

export type ValidateTargetsInput = z.infer<typeof ValidateTargetsSchema>;

export const FinalizeTargetsSchema = ConfigureTargetsSchema.extend({
  confirmShortfalls: z.boolean().optional().default(false),
});

export type FinalizeTargetsInput = z.infer<typeof FinalizeTargetsSchema>;

export const SimulateTargetsSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  totalMembers: z.number().int().min(1, "Total members must be at least 1"),
});

export type SimulateTargetsInput = z.infer<typeof SimulateTargetsSchema>;

export const DepartmentQueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "ARCHIVED"]).default("ALL"),
  campusId: z.string().uuid().optional(),
  sortBy: z.enum(["name", "code", "capacity", "utilization", "priority", "createdAt"]).default("priority"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type DepartmentQueryParams = z.infer<typeof DepartmentQueryParamsSchema>;

// Allowlisted rule types and operators for Department Eligibility (Module 2 sets up; Module 5 evaluates)
export const EligibilityRuleTypeEnum = z.enum([
  "MIN_AGE",
  "MAX_AGE",
  "GENDER",
  "SPIRITUAL_STATUS",
  "BAPTISM_STATUS",
  "SUNDAY_SCHOOL_YEARS",
  "ACADEMIC_DEPARTMENT",
  "LANGUAGE",
  "REGION",
  "CUSTOM",
]);

export const EligibilityOperatorEnum = z.enum([
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN_OR_EQUAL",
  "IN",
  "CONTAINS",
]);

export const EligibilityRuleSchema = z.object({
  id: z.string().optional(),
  ruleName: z.string().min(2, "Rule name must be at least 2 characters").trim(),
  ruleType: EligibilityRuleTypeEnum,
  operator: EligibilityOperatorEnum,
  value: z.any(),
  isMandatory: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export type EligibilityRuleInput = z.infer<typeof EligibilityRuleSchema>;

export const SaveEligibilityRulesSchema = z.object({
  rules: z.array(EligibilityRuleSchema),
});

export type SaveEligibilityRulesInput = z.infer<typeof SaveEligibilityRulesSchema>;
