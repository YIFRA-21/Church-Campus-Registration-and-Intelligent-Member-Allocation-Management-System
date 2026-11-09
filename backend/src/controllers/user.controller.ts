import { Request, Response } from "express";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema";
import { UserService } from "../services/user.service";

export class UserController {
  static async getRoles(req: Request, res: Response) {
    const roles = UserService.getRoles();
    return res.status(200).json({ success: true, data: { roles } });
  }

  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAll(req.user!);
      return res.status(200).json({ success: true, data: { users } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving users";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const user = await UserService.getById(req.params.id, req.user!);
      if (!user) {
        return res.status(404).json({ error: "Not Found", message: "User not found" });
      }
      return res.status(200).json({ success: true, data: { user } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving user";
      return res.status(403).json({ error: "Forbidden", message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = CreateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const user = await UserService.create(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "User successfully created",
        data: { user },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Creation error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const user = await UserService.update(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: "User successfully updated",
        data: { user },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await UserService.delete(req.params.id, req.user!);
      if (!success) {
        return res.status(404).json({ error: "Not Found", message: "User not found" });
      }
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Deletion error";
      return res.status(400).json({ error: "Request Failed", message });
    }
  }
}
