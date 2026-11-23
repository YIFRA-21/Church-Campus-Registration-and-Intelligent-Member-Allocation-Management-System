import { z } from "zod";

export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export type Gender = z.infer<typeof GenderEnum>;

export const CategoryEnum = z.enum([
  "YOUTH",
  "ADULT",
  "ELDER",
  "STUDENT",
  "CHILDREN",
  "YOUNG_ADULT",
]);
export type MemberCategory = z.infer<typeof CategoryEnum>;

export const SpiritualStatusEnum = z.enum(["DEACON", "SERVANT", "REGULAR"]);
export type SpiritualStatus = z.infer<typeof SpiritualStatusEnum>;

export const MemberStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
  "SUSPENDED",
  "ON_HOLD",
]);
export type MemberStatus = z.infer<typeof MemberStatusEnum>;

export const CreateMemberSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  memberId: z
    .string()
    .max(100)
    .trim()
    .optional(),
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  christianName: z.string().optional().default(""),
  gender: GenderEnum,
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((val) => !val || val.length >= 6, {
      message: "Phone number must be at least 6 characters if provided",
    }),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  academicDepartment: z.string().optional().default(""),
  serviceDepartment: z.string().optional().default(""),
  originRegion: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  woreda: z.string().optional().default(""),
  kebele: z.string().optional().default(""),
  dormBlock: z.string().optional().default(""),
  dormRoom: z.string().optional().default(""),
  language: z.string().optional().default("አማርኛ"),
  emergencyContactName: z.string().optional().default(""),
  emergencyContactPhone: z.string().optional().default(""),
  sundaySchoolDuration: z.string().optional().default(""),
  age: z.coerce
    .number()
    .int("Age must be an integer")
    .min(0, "Age cannot be negative")
    .max(150, "Age must be a realistic value")
    .optional(),
  category: CategoryEnum.default("STUDENT"),
  spiritualStatus: SpiritualStatusEnum.default("REGULAR"),
  educationLevel: z.string().optional().default(""),
  address: z.string().optional().default(""),
  emergencyContact: z.string().optional().default(""),
  status: MemberStatusEnum.default("ACTIVE"),
  currentDepartmentId: z.string().uuid().optional().nullable(),
});

export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;

// Member updates omit memberId to enforce Rule 6 (member code immutability)
export const UpdateMemberSchema = CreateMemberSchema.omit({ memberId: true }).partial();
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;

export const ChangeMemberStatusSchema = z.object({
  status: MemberStatusEnum,
  reason: z
    .string()
    .min(5, "A meaningful justification (minimum 5 characters) is required for member status transitions")
    .trim(),
});

export type ChangeMemberStatusInput = z.infer<typeof ChangeMemberStatusSchema>;

export const BatchStatusSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1, "At least one member UUID required"),
  status: MemberStatusEnum,
  reason: z.string().optional().default("Batch administrative status transition"),
});

export type BatchStatusInput = z.infer<typeof BatchStatusSchema>;

export const BatchDeleteSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1, "At least one member UUID required"),
  reason: z.string().optional().default("Batch soft archiving"),
});

export type BatchDeleteInput = z.infer<typeof BatchDeleteSchema>;

export const MemberFilterSchema = z.object({
  campusId: z.string().uuid().optional(),
  search: z.string().optional(),
  gender: GenderEnum.optional(),
  category: CategoryEnum.optional(),
  spiritualStatus: SpiritualStatusEnum.optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "ARCHIVED", "SUSPENDED", "ON_HOLD"]).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  minAge: z.coerce.number().int().min(0).optional(),
  maxAge: z.coerce.number().int().max(150).optional(),
  sortBy: z.enum(["fullName", "memberId", "age", "createdAt", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export type MemberFilterInput = z.infer<typeof MemberFilterSchema>;

// Module 4 Approved Import Integration Schemas
export const FindDuplicateCriteriaSchema = z.object({
  memberId: z.string().optional(),
  phoneNumber: z.string().optional(),
  fullName: z.string().optional(),
  christianName: z.string().optional(),
  campusId: z.string().uuid().optional(),
});

export type FindDuplicateCriteria = z.infer<typeof FindDuplicateCriteriaSchema>;

export const ApprovedImportMemberSchema = z.object({
  campusId: z.string().uuid("Valid Campus UUID required"),
  fullName: z.string().min(1, "Full name required").trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  christianName: z.string().optional().default(""),
  gender: GenderEnum.default("MALE"),
  phoneNumber: z.string().trim().optional().default(""),
  email: z.string().optional().default(""),
  academicDepartment: z.string().optional().default(""),
  sourceDepartmentName: z.string().optional().default(""),
  originRegion: z.string().optional().default(""),
  region: z.string().optional().default(""),
  zone: z.string().optional().default(""),
  woreda: z.string().optional().default(""),
  kebele: z.string().optional().default(""),
  dormBlock: z.string().optional().default(""),
  block: z.string().optional().default(""),
  dormRoom: z.string().optional().default(""),
  dormitory: z.string().optional().default(""),
  language: z.string().optional().default("አማርኛ"),
  emergencyContactName: z.string().optional().default(""),
  emergencyContactPhone: z.string().optional().default(""),
  sundaySchoolDuration: z.string().optional().default(""),
  residenceOrSundaySchool: z.string().optional().default(""),
  age: z.coerce.number().optional(),
  category: CategoryEnum.default("STUDENT"),
  spiritualStatus: SpiritualStatusEnum.default("REGULAR"),
  status: MemberStatusEnum.default("ACTIVE"),
  isApproved: z.boolean().optional().default(true),
  importBatchId: z.string().uuid().optional(),
});

export type ApprovedImportMemberInput = z.infer<typeof ApprovedImportMemberSchema>;
