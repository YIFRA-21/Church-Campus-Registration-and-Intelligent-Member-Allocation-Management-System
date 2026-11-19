import { Request, Response } from "express";
import { LoginSchema, ChangePasswordSchema, UpdateProfileSchema } from "../schemas/auth.schema";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const result = await AuthService.login(parsed.data);
      return res.status(200).json({
        success: true,
        message: "Authentication successful",
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Authentication error";
      return res.status(401).json({
        error: "Unauthorized",
        message,
      });
    }
  }

  static async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "User session required" });
    }

    const profile = AuthService.getProfileById(req.user.userId);
    if (!profile) {
      return res.status(404).json({ error: "Not Found", message: "User profile not found" });
    }

    return res.status(200).json({
      success: true,
      data: { user: profile },
    });
  }

  static async updateProfile(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "User session required" });
    }

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: parsed.error.format(),
      });
    }

    try {
      const updatedUser = AuthService.updateProfile(req.user.userId, parsed.data);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user: updatedUser },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      return res.status(400).json({
        error: "Bad Request",
        message,
      });
    }
  }

  static async changePassword(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "User session required" });
    }

    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: parsed.error.format(),
      });
    }

    try {
      const result = await AuthService.changePassword(
        req.user.userId,
        parsed.data.currentPassword,
        parsed.data.newPassword
      );
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      return res.status(400).json({
        error: "Bad Request",
        message,
      });
    }
  }

  static async logout(req: Request, res: Response) {
    // Stateless JWT tokens are cleared client-side
    return res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  }
}

