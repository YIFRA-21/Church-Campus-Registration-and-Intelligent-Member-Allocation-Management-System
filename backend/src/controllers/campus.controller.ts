import { Request, Response } from "express";
import { CreateCampusSchema, UpdateCampusSchema } from "../schemas/campus.schema";
import { CampusService } from "../services/campus.service";

export class CampusController {
  static async getAll(req: Request, res: Response) {
    try {
      const campuses = await CampusService.getAll(req.user!);
      return res.status(200).json({
        success: true,
        data: { campuses },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving campuses";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const campus = await CampusService.getById(req.params.id, req.user!);
      if (!campus) {
        return res.status(404).json({ error: "Not Found", message: "Campus not found" });
      }
      return res.status(200).json({ success: true, data: { campus } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving campus";
      return res.status(403).json({ error: "Forbidden", message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = CreateCampusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const campus = await CampusService.create(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "Campus successfully created",
        data: { campus },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Creation error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const parsed = UpdateCampusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const campus = await CampusService.update(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: "Campus updated successfully",
        data: { campus },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await CampusService.delete(req.params.id, req.user!);
      if (!success) {
        return res.status(404).json({ error: "Not Found", message: "Campus not found" });
      }
      return res.status(200).json({
        success: true,
        message: "Campus deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Deletion error";
      return res.status(403).json({ error: "Forbidden", message });
    }
  }
}
