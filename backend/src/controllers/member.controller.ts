import { Request, Response } from "express";
import {
  CreateMemberSchema,
  UpdateMemberSchema,
  MemberFilterSchema,
  BatchStatusSchema,
  BatchDeleteSchema,
  ChangeMemberStatusSchema,
  FindDuplicateCriteriaSchema,
  ApprovedImportMemberSchema,
} from "../schemas/member.schema";
import { MemberService } from "../services/member.service";

export class MemberController {
  static async getAll(req: Request, res: Response) {
    try {
      const parsedFilter = MemberFilterSchema.safeParse(req.query);
      if (!parsedFilter.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsedFilter.error.format(),
        });
      }

      const result = await MemberService.getAll(parsedFilter.data, req.user!);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving members";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const member = await MemberService.getById(req.params.id, req.user!);
      if (!member) {
        return res.status(404).json({ error: "Not Found", message: "Member not found" });
      }
      return res.status(200).json({ success: true, data: { member } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving member";
      const status = message.includes("Forbidden") ? 403 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = CreateMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const member = await MemberService.create(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "Member registered successfully",
        data: { member },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Registration error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      // Rule 6: Member code immutability - reject if body contains memberId attempting to alter it
      if (req.body.memberId !== undefined) {
        const existingMember = await MemberService.getById(req.params.id, req.user!);
        if (existingMember && req.body.memberId.trim().toUpperCase() !== existingMember.memberId.toUpperCase()) {
          return res.status(400).json({
            error: "Immutable Field",
            message: "Member code (ተ.ቁ) is permanent and cannot be modified after registration (Rule 6).",
          });
        }
      }

      const parsed = UpdateMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const member = await MemberService.update(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: "Member details updated successfully",
        data: { member },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async changeStatus(req: Request, res: Response) {
    try {
      const parsed = ChangeMemberStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const member = await MemberService.changeStatus(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: `Member status updated to ${parsed.data.status} successfully`,
        data: { member },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Status update error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const history = await MemberService.getHistory(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        data: { history },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "History retrieval error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async archive(req: Request, res: Response) {
    try {
      const reason = (req.body.reason as string) || "Administrative archive requested by authorized user";
      const member = await MemberService.archive(req.params.id, reason, req.user!);
      return res.status(200).json({
        success: true,
        message: "Member successfully archived (soft deletion preserved)",
        data: { member },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Archive error";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      // Soft deletion / archival enforcement (Rule 5)
      await MemberService.delete(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: "Member removed/archived successfully without loss of history",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async batchStatus(req: Request, res: Response) {
    try {
      const parsed = BatchStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const result = await MemberService.batchUpdateStatus(
        parsed.data.memberIds,
        parsed.data.status,
        req.user!
      );
      return res.status(200).json({
        success: true,
        message: `Updated status to ${parsed.data.status} for ${result.updatedCount} members`,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Batch update error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async batchDelete(req: Request, res: Response) {
    try {
      const parsed = BatchDeleteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const result = await MemberService.batchDelete(parsed.data.memberIds, req.user!);
      return res.status(200).json({
        success: true,
        message: `Successfully archived ${result.deletedCount} members`,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Batch delete error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async getDashboardSummary(req: Request, res: Response) {
    try {
      const campusId = req.query.campusId as string | undefined;
      const summary = await MemberService.getDashboardSummary(campusId, req.user!);
      return res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error generating dashboard summary";
      const status = message.includes("Forbidden") ? 403 : 500;
      return res.status(status).json({ error: "Internal Error", message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const campusId = req.query.campusId as string | undefined;
      const stats = await MemberService.getCampusStats(campusId);
      return res.status(200).json({ success: true, data: { stats } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving statistics";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  // Module 4 Import Integration Service Handlers
  static async findExisting(req: Request, res: Response) {
    try {
      const parsed = FindDuplicateCriteriaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const existing = await MemberService.findExistingMember(parsed.data);
      return res.status(200).json({
        success: true,
        data: { member: existing, isMatch: Boolean(existing) },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Duplicate check error";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async createApprovedImport(req: Request, res: Response) {
    try {
      const parsed = ApprovedImportMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const member = await MemberService.createApprovedImportMember(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "Approved imported member created successfully with generated code",
        data: { member },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Approved import creation failed";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async updateApprovedImport(req: Request, res: Response) {
    try {
      const parsed = ApprovedImportMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.format(),
        });
      }

      const member = await MemberService.updateApprovedImportMember(req.params.id, parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: "Approved imported member updated successfully preserving original code",
        data: { member },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Approved import update failed";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }
}


