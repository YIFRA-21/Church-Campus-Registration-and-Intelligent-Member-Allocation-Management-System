import { Router } from "express";
import { ImportController } from "../controllers/import.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

// Templates
router.get("/template", requirePermission("member.import_excel"), ImportController.downloadTemplate);
router.get("/template/csv", requirePermission("member.import_excel"), ImportController.downloadCsvTemplate);

// Upload & Stage
router.post("/upload", requirePermission("member.import_excel"), ImportController.uploadCsv);

// Batch History & Listing
router.get("/", requirePermission("member.import_excel"), ImportController.getHistory);
router.get("/history", requirePermission("member.import_excel"), ImportController.getHistory);

// Specific Batch Details
router.get("/:id", requirePermission("member.import_excel"), ImportController.getBatchById);
router.get("/batches/:id", requirePermission("member.import_excel"), ImportController.getBatchById);

// Preview & Column Mapping
router.get("/:id/preview", requirePermission("member.import_excel"), ImportController.getPreview);
router.post("/:id/mapping", requirePermission("member.import_excel"), ImportController.saveMappings);

// Validation
router.post("/:id/validate", requirePermission("member.import_excel"), ImportController.validateBatch);
router.get("/:id/validation-results", requirePermission("member.import_excel"), ImportController.getValidationResults);

// Duplicate Review Center
router.get("/:id/duplicates", requirePermission("member.import_excel"), ImportController.getDuplicates);
router.post(
  "/:id/duplicates/:duplicateId/review",
  requirePermission("member.import_excel"),
  ImportController.reviewDuplicate
);

// Staged Records
router.get("/:id/records", requirePermission("member.import_excel"), ImportController.getRecords);

// Approval & Processing Pipeline
router.post("/:id/approve", requirePermission("member.import_excel"), ImportController.approveBatch);
router.post("/:id/process", requirePermission("member.import_excel"), ImportController.processBatch);
router.post("/:id/retry", requirePermission("member.import_excel"), ImportController.retryBatch);

// Downloads
router.get("/:id/original-file", requirePermission("member.import_excel"), ImportController.downloadOriginalFile);
router.get("/:id/errors", requirePermission("member.import_excel"), ImportController.downloadErrorReport);
router.get("/batches/:id/errors", requirePermission("member.import_excel"), ImportController.downloadErrorReport);

export default router;
