import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email("Valid email address required").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").trim(),
  phoneNumber: z.string().optional(),
  campusId: z.string().uuid("Valid Campus UUID required").optional().nullable(),
  role: z.enum([
    "SUPER_ADMIN",
    "CAMPUS_ADMIN",
    "REGISTRATION_OFFICER",
    "DEPT_MANAGER",
    "EVALUATOR",
    "VIEWER_AUDITOR",
  ]),
  customPermissions: z.array(z.string()).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  campusId: z.string().uuid().optional().nullable(),
  role: z
    .enum([
      "SUPER_ADMIN",
      "CAMPUS_ADMIN",
      "REGISTRATION_OFFICER",
      "DEPT_MANAGER",
      "EVALUATOR",
      "VIEWER_AUDITOR",
    ])
    .optional(),
  customPermissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
