import { Request, Response } from "express";
import {
  CreateCampusSchema,
  UpdateCampusSchema,
  ChangeCampusStatusSchema,
  CampusQueryParamsSchema,
} from "../schemas/campus.schema";
import { CampusService } from "../services/campus.service";

export class CampusController {
  /**
   * Get all campuses with pagination, search, status, and sorting
   */
  static async getAll(req: Request, res: Response) {
    try {
      const parsedQuery = CampusQueryParamsSchema.safeParse(req.query);
      const queryParams = parsedQuery.success ? parsedQuery.data : {};
      const result = await CampusService.getAll(queryParams, req.user!);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving campuses";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Get executive dashboard summary statistics
   */
  static async getDashboardSummary(req: Request, res: Response) {
    try {
      const summary = await CampusService.getDashboardSummary(req.user!);
      return res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving dashboard metrics";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Get campus details by UUID
   */
  static async getById(req: Request, res: Response) {
    try {
      const campus = await CampusService.getById(req.params.id, req.user!);
      if (!campus) {
        return res.status(404).json({ error: "Not Found", message: "Campus not found" });
      }
      return res.status(200).json({ success: true, data: { campus } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving campus";
      const status = message.includes("Forbidden") ? 403 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Register a new campus with primary contact and initial status history
   */
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
        message: `Campus "${campus.name}" (${campus.code}) successfully registered`,
        data: { campus },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Creation error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Update campus details
   */
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

  /**
   * Change Campus Status with mandatory reason and audit history
   */
  static async changeStatus(req: Request, res: Response) {
    try {
      const parsed = ChangeCampusStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const campus = await CampusService.changeStatus(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: `Campus status successfully transitioned to "${campus.status}"`,
        data: { campus },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Status transition error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Get contact directory for a campus
   */
  static async getContacts(req: Request, res: Response) {
    try {
      const campus = await CampusService.getById(req.params.id, req.user!);
      if (!campus) {
        return res.status(404).json({ error: "Not Found", message: "Campus not found" });
      }
      return res.status(200).json({
        success: true,
        data: { contacts: campus.contacts },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving contacts";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Update contact directory for a campus (enforces <= 1 primary contact)
   */
  static async updateContacts(req: Request, res: Response) {
    try {
      const contacts = req.body.contacts;
      if (!Array.isArray(contacts)) {
        return res.status(400).json({ error: "Validation Error", message: "contacts must be an array" });
      }

      const updated = await CampusService.updateContacts(req.params.id, contacts, req.user!);
      return res.status(200).json({
        success: true,
        message: "Campus contacts updated successfully",
        data: { contacts: updated },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error updating contacts";
      return res.status(400).json({ error: "Request Failed", message });
    }
  }

  /**
   * Get status history timeline for a campus
   */
  static async getStatusHistory(req: Request, res: Response) {
    try {
      const history = await CampusService.getStatusHistory(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        data: { history },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving status history";
      const status = message.includes("not found") ? 404 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Backward-compatible toggle active
   */
  static async toggleActive(req: Request, res: Response) {
    try {
      const campus = await CampusService.toggleActive(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: `Campus is now ${campus.status}`,
        data: { campus },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Activation error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Soft delete or archive campus
   */
  static async delete(req: Request, res: Response) {
    try {
      const success = await CampusService.delete(req.params.id, req.user!);
      if (!success) {
        return res.status(404).json({ error: "Not Found", message: "Campus not found" });
      }
      return res.status(200).json({
        success: true,
        message: "Campus archived or deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Deletion error";
      const status = message.includes("Forbidden") ? 403 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }
}
