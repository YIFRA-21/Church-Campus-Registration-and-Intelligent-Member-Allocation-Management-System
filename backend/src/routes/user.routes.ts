import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/roles", UserController.getRoles);
router.get("/", requirePermission("user.manage"), UserController.getAll);
router.get("/:id", requirePermission("user.manage"), UserController.getById);
router.post("/", requirePermission("user.manage"), UserController.create);
router.put("/:id", requirePermission("user.manage"), UserController.update);
router.delete("/:id", requirePermission("user.manage"), UserController.delete);

export default router;
