import { Router } from "express";
import { CampusController } from "../controllers/campus.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", requirePermission("campus.view"), CampusController.getAll);
router.get("/:id", requirePermission("campus.view"), CampusController.getById);
router.post("/", requirePermission("campus.manage"), CampusController.create);
router.put("/:id", requirePermission("campus.manage"), CampusController.update);
router.delete("/:id", requirePermission("campus.manage"), CampusController.delete);

export default router;
