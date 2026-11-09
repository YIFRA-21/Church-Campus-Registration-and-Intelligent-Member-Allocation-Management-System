import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Valid email address required").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterUserSchema = z.object({
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
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export interface AuthSessionPayload {
  userId: string;
  email: string;
  fullName: string;
  campusId: string | null;
  role: string;
  permissions: string[];
}

