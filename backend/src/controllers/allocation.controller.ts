import { Request, Response } from "express";
import {
  RunAllocationSchema,
  ResolveExceptionSchema,
  ApproveAllocationSchema,
  EligibilityRuleSchema,
} from "../schemas/allocation.schema";
import { AllocationService } from "../services/allocation.service";
import { EligibilityService } from "../services/eligibility.service";

export class AllocationController {
  static async runAllocation(req: Request, res: Response) {
    try {
      const parsed = RunAllocationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const batch = await AllocationService.runAllocation(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "Intelligent allocation executed successfully (Preview Ready)",
        data: { batch },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Allocation execution error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Allocation Failed", message });
    }
  }

  static async getBatches(req: Request, res: Response) {
    try {
      const campusId = req.query.campusId as string | undefined;
      const batches = await AllocationService.getBatches(campusId);
      return res.status(200).json({ success: true, data: { batches } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving batches";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getBatchById(req: Request, res: Response) {
    try {
      const batch = await AllocationService.getBatchById(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: "Not Found", message: "Allocation batch not found" });
      }
      return res.status(200).json({ success: true, data: { batch } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving batch";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getBatchAllocations(req: Request, res: Response) {
    try {
      const allocations = await AllocationService.getAllocationsForBatch(req.params.id);
      return res.status(200).json({ success: true, data: { allocations } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving allocations";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getBatchExceptions(req: Request, res: Response) {
    try {
      const status = req.query.status as "PENDING" | "RESOLVED" | "ON_HOLD" | undefined;
      const exceptions = await AllocationService.getExceptionsForBatch(req.params.id, status);
      return res.status(200).json({ success: true, data: { exceptions } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving exceptions";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async resolveException(req: Request, res: Response) {
    try {
      const parsed = ResolveExceptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const exception = await AllocationService.resolveException(
        req.params.id,
        parsed.data,
        req.user!
      );
      return res.status(200).json({
        success: true,
        message: "Exception resolved successfully",
        data: { exception },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Resolution error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Resolution Failed", message });
    }
  }

  static async approveBatch(req: Request, res: Response) {
    try {
      const parsed = ApproveAllocationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const approvedBatch = await AllocationService.approveBatch(parsed.data.batchId, req.user!);
      return res.status(200).json({
        success: true,
        message: "Final allocation committed and approved successfully",
        data: { batch: approvedBatch },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Approval error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Approval Failed", message });
    }
  }

  // --- Eligibility Rules ---

  static async getRules(req: Request, res: Response) {
    try {
      const departmentId = req.params.departmentId;
      const rules = await EligibilityService.getRulesForDepartment(departmentId);
      return res.status(200).json({ success: true, data: { rules } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving rules";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async addRule(req: Request, res: Response) {
    try {
      const parsed = EligibilityRuleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const rule = await EligibilityService.addRule(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "Eligibility rule added successfully",
        data: { rule },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Rule creation error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async deleteRule(req: Request, res: Response) {
    try {
      await EligibilityService.deleteRule(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: "Eligibility rule removed successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Rule deletion error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }
}

