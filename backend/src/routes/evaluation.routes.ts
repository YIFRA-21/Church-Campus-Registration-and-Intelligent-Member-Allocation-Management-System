import { Router } from "express";
import { EvaluationController } from "../controllers/evaluation.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticateJWT);

// Task management
router.post(
  "/tasks",
  requirePermission("evaluation.assign"),
  EvaluationController.createTask
);

router.get(
  "/tasks",
  requirePermission("evaluation.view_assigned"),
  EvaluationController.getTasks
);

router.get(
  "/tasks/:id",
  requirePermission("evaluation.view_assigned"),
  EvaluationController.getTaskDetails
);

// Assessment scoring & drafts
router.post(
  "/assessments",
  requirePermission("evaluation.score"),
  EvaluationController.saveEvaluation
);

// Admin review workflows
router.post(
  "/assessments/:id/correction",
  requirePermission("evaluation.review"),
  EvaluationController.requestCorrection
);

router.post(
  "/assessments/:id/approve",
  requirePermission("evaluation.review"),
  EvaluationController.approveEvaluation
);

// Submission history
router.get(
  "/history",
  requirePermission("evaluation.history"),
  EvaluationController.getHistory
);

export default router;

