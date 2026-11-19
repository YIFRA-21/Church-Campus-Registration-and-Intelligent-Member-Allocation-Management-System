import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/analytics", requirePermission("reports.view"), ReportController.getDashboardAnalytics);
router.get("/department-distribution", requirePermission("reports.view"), ReportController.getDepartmentDistribution);
router.get("/evaluator-performance", requirePermission("reports.view"), ReportController.getEvaluatorPerformance);
router.get("/export", requirePermission("reports.export"), ReportController.exportReport);
router.get("/audit-logs", requirePermission("audit.view"), ReportController.getAuditLogs);

export default router;

