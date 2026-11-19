import { z } from "zod";

export const SystemRoleEnum = z.enum(["ADMIN", "EVALUATOR"]);
export type SystemRole = z.infer<typeof SystemRoleEnum>;

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
  role: SystemRoleEnum,
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  avatarUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  username: z.string().optional(),
  honorific: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  languages: z.array(z.string()).optional(),
  confessionFather: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  subcity: z.string().optional(),
  woreda: z.string().optional(),
  houseNumber: z.string().optional(),
  homeParish: z.string().optional(),
  specialization: z.string().optional(),
  panel: z.string().optional(),
  governanceScope: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export interface AuthSessionPayload {
  userId: string;
  email: string;
  fullName: string;
  campusId: string | null;
  role: "ADMIN" | "EVALUATOR";
  permissions: string[];
}
