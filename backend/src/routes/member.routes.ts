import { Router } from "express";
import { MemberController } from "../controllers/member.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

// Dashboard & Analytics
router.get("/dashboard/summary", requirePermission("member.view_all"), MemberController.getDashboardSummary);
router.get("/stats", requirePermission("member.view_all"), MemberController.getStats);

// Batch operations
router.post("/batch-status", requirePermission("member.manage"), MemberController.batchStatus);
router.post("/batch-delete", requirePermission("member.manage"), MemberController.batchDelete);

// Module 4 Import Integration Service Routes
router.post("/import/find-duplicate", requirePermission("member.view_all"), MemberController.findExisting);
router.post("/import/approved-create", requirePermission("member.register"), MemberController.createApprovedImport);
router.put("/import/approved-update/:id", requirePermission("member.manage"), MemberController.updateApprovedImport);

// Core Member CRUD & Status Management
router.get("/", requirePermission("member.view_all"), MemberController.getAll);
router.get("/:id", requirePermission("member.view_all"), MemberController.getById);
router.get("/:id/history", requirePermission("member.view_all"), MemberController.getHistory);
router.post("/", requirePermission("member.register"), MemberController.create);
router.put("/:id", requirePermission("member.manage"), MemberController.update);
router.patch("/:id", requirePermission("member.manage"), MemberController.update);
router.patch("/:id/status", requirePermission("member.manage"), MemberController.changeStatus);
router.patch("/:id/archive", requirePermission("member.manage"), MemberController.archive);
router.delete("/:id", requirePermission("member.manage"), MemberController.delete);

export default router;

