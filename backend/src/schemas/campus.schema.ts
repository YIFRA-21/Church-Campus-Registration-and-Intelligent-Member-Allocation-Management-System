import { z } from "zod";

export const CampusStatusEnum = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export type CampusStatus = z.infer<typeof CampusStatusEnum>;

export const CampusContactSchema = z.object({
  id: z.string().optional(),
  contactName: z.string().min(2, "Contact name must be at least 2 characters").trim(),
  position: z.string().optional().default(""),
  phone: z.string().min(6, "Valid phone number required").trim(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
});

export type CampusContactInput = z.infer<typeof CampusContactSchema>;

export const CreateCampusSchema = z.object({
  code: z
    .string()
    .min(2, "Campus code must be at least 2 characters")
    .max(10, "Campus code must not exceed 10 characters")
    .toUpperCase()
    .trim(),
  name: z.string().min(3, "Campus name must be at least 3 characters").trim(),
  description: z.string().optional().default(""),
  region: z.string().optional().default("Addis Ababa"),
  city: z.string().min(2, "City is required").trim(),
  subCity: z.string().optional().default(""),
  woreda: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),
  email: z.string().email("Valid email address required").optional().or(z.literal("")),
  status: CampusStatusEnum.default("ACTIVE"),
  primaryContactName: z.string().optional().default(""),
  primaryContactPhone: z.string().optional().default(""),
  primaryContactPosition: z.string().optional().default("Campus Coordinator"),
  primaryContactEmail: z.string().email().optional().or(z.literal("")),
});

export type CreateCampusInput = z.infer<typeof CreateCampusSchema>;

export const UpdateCampusSchema = CreateCampusSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateCampusInput = z.infer<typeof UpdateCampusSchema>;

export const ChangeCampusStatusSchema = z.object({
  status: CampusStatusEnum,
  reason: z.string().min(5, "A meaningful reason (minimum 5 characters) is required for status changes").trim(),
});

export type ChangeCampusStatusInput = z.infer<typeof ChangeCampusStatusSchema>;

export const CampusQueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE", "ARCHIVED"]).default("ALL"),
  region: z.string().optional(),
  city: z.string().optional(),
  sortBy: z.enum(["name", "code", "createdAt", "city", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CampusQueryParams = z.infer<typeof CampusQueryParamsSchema>;
