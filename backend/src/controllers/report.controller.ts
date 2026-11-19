import { Request, Response } from "express";
import { ReportService } from "../services/report.service";
import { AuditService } from "../services/audit.service";

export class ReportController {
  static async getDashboardAnalytics(req: Request, res: Response) {
    try {
      const campusId = req.query.campusId as string | undefined;
      const analytics = await ReportService.getDashboardAnalytics(campusId, req.user!);
      return res.status(200).json({ success: true, data: analytics });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving analytics";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getDepartmentDistribution(req: Request, res: Response) {
    try {
      const campusId = (req.query.campusId as string) || "a0000000-0000-0000-0000-000000000001";
      const report = await ReportService.getDepartmentDistributionReport(campusId, req.user!);
      return res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving distribution report";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getEvaluatorPerformance(req: Request, res: Response) {
    try {
      const report = await ReportService.getEvaluatorPerformanceReport(req.user!);
      return res.status(200).json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving evaluator performance";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async exportReport(req: Request, res: Response) {
    try {
      const reportType = (req.query.type as any) || "department_distribution";
      const campusId = req.query.campusId as string | undefined;

      const buffer = await ReportService.exportReportExcel(reportType, campusId, req.user!);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="C-CIMAS-${reportType}-Report.xlsx"`
      );
      return res.status(200).send(buffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Export report error";
      return res.status(500).json({ error: "Export Failed", message });
    }
  }

  static async getAuditLogs(req: Request, res: Response) {
    try {
      const { campusId, action, entityType, search, page, limit } = req.query;
      const data = await AuditService.getAll({
        campusId: campusId as string | undefined,
        action: action as string | undefined,
        entityType: entityType as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
      });

      return res.status(200).json({ success: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving audit logs";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }
}
