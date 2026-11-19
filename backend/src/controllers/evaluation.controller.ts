import { Request, Response } from "express";
import { EvaluationService } from "../services/evaluation.service";
import {
  CreateEvaluationTaskSchema,
  SubmitEvaluationSchema,
  CorrectionRequestSchema,
  ApproveEvaluationSchema,
} from "../schemas/evaluation.schema";

export class EvaluationController {
  static async createTask(req: Request, res: Response) {
    try {
      const parsed = CreateEvaluationTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const task = await EvaluationService.createTask(parsed.data, req.user!);
      return res.status(201).json({
        success: true,
        message: "Evaluation task created and assigned successfully",
        data: { task },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error creating task";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async getTasks(req: Request, res: Response) {
    try {
      const { campusId, status } = req.query;
      const tasks = await EvaluationService.getTasks(
        {
          campusId: campusId as string | undefined,
          status: status as any,
        },
        req.user!
      );
      return res.status(200).json({ success: true, data: { tasks } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error fetching tasks";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  static async getTaskDetails(req: Request, res: Response) {
    try {
      const details = await EvaluationService.getTaskDetails(req.params.id, req.user!);
      return res.status(200).json({ success: true, data: details });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error fetching task details";
      const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async saveEvaluation(req: Request, res: Response) {
    try {
      const parsed = SubmitEvaluationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const evaluation = await EvaluationService.saveEvaluation(parsed.data, req.user!);
      return res.status(200).json({
        success: true,
        message: parsed.data.isDraft
          ? "Evaluation draft saved successfully"
          : "Evaluation assessment submitted successfully",
        data: { evaluation },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error saving evaluation";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async requestCorrection(req: Request, res: Response) {
    try {
      const parsed = CorrectionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const evaluation = await EvaluationService.requestCorrection(
        req.params.id,
        parsed.data,
        req.user!
      );
      return res.status(200).json({
        success: true,
        message: "Correction requested successfully from evaluator",
        data: { evaluation },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error requesting correction";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async approveEvaluation(req: Request, res: Response) {
    try {
      const parsed = ApproveEvaluationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const evaluation = await EvaluationService.approveEvaluation(
        req.params.id,
        parsed.data,
        req.user!
      );
      return res.status(200).json({
        success: true,
        message: "Evaluation assessment approved successfully",
        data: { evaluation },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error approving evaluation";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const history = await EvaluationService.getEvaluatorHistory(req.user!);
      return res.status(200).json({ success: true, data: { history } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error fetching history";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }
}
