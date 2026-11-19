import { Router } from "express";
import { CampusController } from "../controllers/campus.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

// Executive Dashboard Summary (Placed before /:id to prevent route shadowing)
router.get("/dashboard/summary", requirePermission("campus.view"), CampusController.getDashboardSummary);

// Directory & List
router.get("/", requirePermission("campus.view"), CampusController.getAll);
router.post("/", requirePermission("campus.manage"), CampusController.create);

// Individual Campus Node Operations
router.get("/:id", requirePermission("campus.view"), CampusController.getById);
router.patch("/:id", requirePermission("campus.manage"), CampusController.update);
router.put("/:id", requirePermission("campus.manage"), CampusController.update);

// Status Lifecycle Management & Audit
router.patch("/:id/status", requirePermission("campus.manage"), CampusController.changeStatus);
router.patch("/:id/toggle-active", requirePermission("campus.manage"), CampusController.toggleActive);
router.get("/:id/history", requirePermission("campus.view"), CampusController.getStatusHistory);

// Contact Directory Management
router.get("/:id/contacts", requirePermission("campus.view"), CampusController.getContacts);
router.put("/:id/contacts", requirePermission("campus.manage"), CampusController.updateContacts);

// Archival / Soft-Delete
router.delete("/:id", requirePermission("campus.manage"), CampusController.delete);

export default router;
