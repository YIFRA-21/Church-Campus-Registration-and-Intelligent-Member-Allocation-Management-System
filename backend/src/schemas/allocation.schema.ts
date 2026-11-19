import { z } from "zod";

export const RuleTypeEnum = z.enum(["GENDER", "CATEGORY", "SPIRITUAL_STATUS", "CUSTOM"]);
export type RuleType = z.infer<typeof RuleTypeEnum>;

export const EligibilityRuleSchema = z.object({
  departmentId: z.string().uuid("Valid Department UUID required"),
  ruleName: z.string().min(2).trim(),
  ruleType: RuleTypeEnum,
  operator: z.enum(["EQUALS", "IN", "NOT_EQUALS"]).default("IN"),
  value: z.array(z.string()).min(1, "At least one allowed rule value required"),
  isMandatory: z.boolean().default(true),
});

export type EligibilityRuleInput = z.infer<typeof EligibilityRuleSchema>;

export const RunAllocationSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  cycleName: z.string().min(2, "Allocation cycle name required").trim(),
});

export type RunAllocationInput = z.infer<typeof RunAllocationSchema>;

export const ResolveExceptionSchema = z.object({
  action: z.enum(["ASSIGN", "OVERRIDE", "HOLD"]),
  departmentId: z.string().uuid().optional(),
  justification: z.string().min(3, "Documented justification reason required").trim(),
});

export type ResolveExceptionInput = z.infer<typeof ResolveExceptionSchema>;

export const ApproveAllocationSchema = z.object({
  batchId: z.string().uuid("Valid Allocation Batch UUID required"),
});

export type ApproveAllocationInput = z.infer<typeof ApproveAllocationSchema>;

