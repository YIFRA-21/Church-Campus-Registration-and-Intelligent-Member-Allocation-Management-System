import { z } from "zod";

export const CreateCampusSchema = z.object({
  code: z
    .string()
    .min(2, "Campus code must be at least 2 characters")
    .max(10, "Campus code must not exceed 10 characters")
    .toUpperCase()
    .trim(),
  name: z.string().min(3, "Campus name must be at least 3 characters").trim(),
  city: z.string().min(2, "City is required").trim(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email("Valid email address required").optional().or(z.literal("")),
});

export type CreateCampusInput = z.infer<typeof CreateCampusSchema>;

export const UpdateCampusSchema = CreateCampusSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateCampusInput = z.infer<typeof UpdateCampusSchema>;
