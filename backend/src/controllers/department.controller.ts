import { Request, Response } from "express";
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  ChangeDepartmentStatusSchema,
  UpdateDepartmentCapacitySchema,
  ConfigureTargetsSchema,
  ValidateTargetsSchema,
  FinalizeTargetsSchema,
  SimulateTargetsSchema,
  DepartmentQueryParamsSchema,
  SaveEligibilityRulesSchema,
} from "../schemas/department.schema";
import { DepartmentService } from "../services/department.service";

export class DepartmentController {
  /**
   * Real-time KPI summary for executive dashboard
   */
  static async getDashboardSummary(req: Request, res: Response) {
    try {
      const campusId = req.query.campusId as string | undefined;
      const summary = await DepartmentService.getDashboardSummary(campusId, req.user);
      return res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving dashboard summary";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * List departments with pagination, search, status filtering and sorting
   */
  static async getAll(req: Request, res: Response) {
    try {
      const parsed = DepartmentQueryParamsSchema.safeParse(req.query);
      const queryParams = parsed.success ? parsed.data : {};
      const result = await DepartmentService.getPaginated(queryParams, req.user);
      return res.status(200).json({
        success: true,
        data: {
          departments: result.departments,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving departments";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Get single department by ID with audit logs & rules
   */
  static async getById(req: Request, res: Response) {
    try {
      const dept = await DepartmentService.getById(req.params.id);
      if (!dept) {
        return res.status(404).json({ error: "Not Found", message: "Department not found" });
      }
      return res.status(200).json({ success: true, data: { department: dept } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving department";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Create department
   */
  static async create(req: Request, res: Response) {
    try {
      const parsed = CreateDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const department = await DepartmentService.create(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "Department registered successfully",
        data: { department },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Creation error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Update department metadata
   */
  static async update(req: Request, res: Response) {
    try {
      const parsed = UpdateDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const { department, warning } = await DepartmentService.update(
        req.params.id,
        parsed.data,
        req.user!
      );
      return res.status(200).json({
        success: true,
        message: "Department updated successfully",
        warning,
        data: { department },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Change Department Status with audit history
   */
  static async changeStatus(req: Request, res: Response) {
    try {
      const parsed = ChangeDepartmentStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const department = await DepartmentService.changeStatus(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: `Department status changed to ${department.status}`,
        data: { department },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Status error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Update Department Capacity with safety confirmation
   */
  static async updateCapacity(req: Request, res: Response) {
    try {
      const parsed = UpdateDepartmentCapacitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const result = await DepartmentService.updateCapacity(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: result.message,
        requiresConfirmation: result.requiresConfirmation,
        shortfall: result.shortfall,
        data: { department: result.department },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Capacity error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Toggle Active (backward compatible shortcut)
   */
  static async toggleActive(req: Request, res: Response) {
    try {
      const department = await DepartmentService.toggleActive(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: `Department ${department.isActive ? "activated" : "deactivated"} successfully`,
        data: { department },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Status error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Delete Department
   */
  static async delete(req: Request, res: Response) {
    try {
      await DepartmentService.delete(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  // ==========================================
  // PERCENTAGE TARGETS STUDIO
  // ==========================================

  static async getCurrentTargetConfiguration(req: Request, res: Response) {
    try {
      const campusId = (req.query.campusId as string) || (req.params.campusId as string);
      if (!campusId) {
        return res.status(400).json({ error: "Bad Request", message: "campusId query parameter required" });
      }

      const config = await DepartmentService.getCurrentTargetConfiguration(campusId);
      return res.status(200).json({ success: true, data: { configuration: config } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving target configuration";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getTargetHistory(req: Request, res: Response) {
    try {
      const campusId = (req.query.campusId as string) || (req.params.campusId as string);
      if (!campusId) {
        return res.status(400).json({ error: "Bad Request", message: "campusId query parameter required" });
      }

      const history = await DepartmentService.getTargetHistory(campusId);
      return res.status(200).json({ success: true, data: { history } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving target history";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Validate percentage targets without saving (returns sum, difference, shortfall check)
   */
  static async validateTargets(req: Request, res: Response) {
    try {
      const parsed = ValidateTargetsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const result = await DepartmentService.validateTargets(parsed.data.campusId, parsed.data);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Validation error";
      return res.status(400).json({ error: "Validation Failed", message });
    }
  }

  /**
   * Finalize and lock target configuration (Immutable Snapshot Version)
   */
  static async finalizeTargets(req: Request, res: Response) {
    try {
      const parsed = FinalizeTargetsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const configuration = await DepartmentService.finalizeTargets(parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: `Version ${configuration.version} target configuration finalized and locked.`,
        data: { configuration },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Finalization error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Backward-compatible configure targets
   */
  static async configureTargets(req: Request, res: Response) {
    try {
      const parsed = ConfigureTargetsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const configuration = await DepartmentService.finalizeTargets(
        { ...parsed.data, confirmShortfalls: true },
        req.user!
      );
      return res.status(200).json({
        success: true,
        message: "Department percentage targets successfully configured",
        data: { configuration },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Configuration error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Largest Remainder Method simulation
   */
  static async simulateTargets(req: Request, res: Response) {
    try {
      const parsed = SimulateTargetsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const simulation = await DepartmentService.simulateTargets(
        parsed.data.campusId,
        parsed.data.totalMembers
      );
      return res.status(200).json({
        success: true,
        message: "Target simulation calculated via Largest Remainder Method",
        data: simulation,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Simulation error";
      return res.status(400).json({ error: "Simulation Failed", message });
    }
  }

  // ==========================================
  // ELIGIBILITY RULES CONFIGURATION
  // ==========================================

  static async getEligibilityRules(req: Request, res: Response) {
    try {
      const rules = await DepartmentService.getEligibilityRules(req.params.id);
      return res.status(200).json({
        success: true,
        data: { rules },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving eligibility rules";
      const status = message.includes("not found") ? 404 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async saveEligibilityRules(req: Request, res: Response) {
    try {
      const parsed = SaveEligibilityRulesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const rules = await DepartmentService.saveEligibilityRules(
        req.params.id,
        parsed.data.rules,
        req.user!
      );
      return res.status(200).json({
        success: true,
        message: "Eligibility rules updated successfully",
        data: { rules },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error saving eligibility rules";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  // ==========================================
  // DEPARTMENT-WISE MEMBER DISPLAY (MODULE 10)
  // ==========================================

  static async getRoster(req: Request, res: Response) {
    try {
      const departmentId = req.params.id;
      const { search, gender, category, spiritualStatus, page, limit } = req.query;

      const roster = await DepartmentService.getDepartmentRoster(
        departmentId,
        {
          search: search as string | undefined,
          gender: gender as string | undefined,
          category: category as string | undefined,
          spiritualStatus: spiritualStatus as string | undefined,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        },
        req.user!
      );

      return res.status(200).json({ success: true, data: roster });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving roster";
      const status = message.includes("not found") ? 404 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async exportRoster(req: Request, res: Response) {
    try {
      const departmentId = req.params.id;
      const buffer = await DepartmentService.exportDepartmentRosterExcel(
        departmentId,
        req.user!
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="C-CIMAS-Department-${departmentId}-Roster.xlsx"`
      );
      return res.status(200).send(buffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export error";
      const status = message.includes("not found") ? 404 : 500;
      return res.status(status).json({ error: "Export Failed", message });
    }
  }
}
