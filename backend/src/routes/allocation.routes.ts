import { Router } from "express";
import { AllocationController } from "../controllers/allocation.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

router.post("/run", requirePermission("allocation.run"), AllocationController.runAllocation);
router.get("/batches", requirePermission("allocation.review"), AllocationController.getBatches);
router.get("/batches/:id", requirePermission("allocation.review"), AllocationController.getBatchById);
router.get("/batches/:id/allocations", requirePermission("allocation.review"), AllocationController.getBatchAllocations);
router.get("/batches/:id/exceptions", requirePermission("allocation.review"), AllocationController.getBatchExceptions);
router.post("/exceptions/:id/resolve", requirePermission("allocation.override"), AllocationController.resolveException);
router.post("/approve", requirePermission("allocation.approve"), AllocationController.approveBatch);

// Rules
router.get("/rules/:departmentId", requirePermission("department.eligibility.manage"), AllocationController.getRules);
router.post("/rules", requirePermission("department.eligibility.manage"), AllocationController.addRule);
router.delete("/rules/:id", requirePermission("department.eligibility.manage"), AllocationController.deleteRule);

export default router;

