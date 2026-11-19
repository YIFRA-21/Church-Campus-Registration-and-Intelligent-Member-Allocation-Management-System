import { Router } from "express";
import { ImportController } from "../controllers/import.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/template", requirePermission("member.import_excel"), ImportController.downloadTemplate);
router.post("/upload", requirePermission("member.import_excel"), ImportController.uploadFile);
router.get("/history", requirePermission("member.import_excel"), ImportController.getHistory);
router.get("/batches/:id", requirePermission("member.import_excel"), ImportController.getBatchById);
router.get("/batches/:id/errors", requirePermission("member.import_excel"), ImportController.downloadErrorReport);

export default router;

