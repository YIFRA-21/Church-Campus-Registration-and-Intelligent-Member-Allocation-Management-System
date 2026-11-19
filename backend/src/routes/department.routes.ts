import { Router } from "express";
import { DepartmentController } from "../controllers/department.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

// Executive Dashboard KPI Summary
router.get("/dashboard/summary", requirePermission("department.view"), DepartmentController.getDashboardSummary);

// Target Configuration Studio Endpoints
router.get("/targets", requirePermission("department.view"), DepartmentController.getCurrentTargetConfiguration);
router.get("/targets/current", requirePermission("department.view"), DepartmentController.getCurrentTargetConfiguration);
router.get("/targets/history", requirePermission("department.view"), DepartmentController.getTargetHistory);
router.post("/targets/validate", requirePermission("department.view"), DepartmentController.validateTargets);
router.post("/targets/finalize", requirePermission("department.target.manage"), DepartmentController.finalizeTargets);
router.post("/targets/configure", requirePermission("department.target.manage"), DepartmentController.configureTargets);
router.post("/targets/simulate", requirePermission("department.view"), DepartmentController.simulateTargets);

// Standard Directory CRUD & Lifecycle
router.get("/", requirePermission("department.view"), DepartmentController.getAll);
router.post("/", requirePermission("department.manage"), DepartmentController.create);

router.get("/:id", requirePermission("department.view"), DepartmentController.getById);
router.put("/:id", requirePermission("department.manage"), DepartmentController.update);
router.patch("/:id/status", requirePermission("department.manage"), DepartmentController.changeStatus);
router.patch("/:id/capacity", requirePermission("department.manage"), DepartmentController.updateCapacity);
router.patch("/:id/toggle-active", requirePermission("department.manage"), DepartmentController.toggleActive);
router.delete("/:id", requirePermission("department.manage"), DepartmentController.delete);

// Eligibility Rules Configuration (Modules 2 & 5)
router.get("/:id/eligibility-rules", requirePermission("department.view"), DepartmentController.getEligibilityRules);
router.put("/:id/eligibility-rules", requirePermission("department.manage"), DepartmentController.saveEligibilityRules);

// Department-Wise Member Roster (Module 10)
router.get("/:id/roster", requirePermission("department.view"), DepartmentController.getRoster);
router.get("/:id/export", requirePermission("department.view"), DepartmentController.exportRoster);

export default router;
