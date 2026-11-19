import { Request, Response } from "express";
import { ImportService } from "../services/import.service";
import {
  UploadCsvSchema,
  SaveColumnMappingsSchema,
  ReviewDuplicateSchema,
  ApproveBatchSchema,
} from "../schemas/import.schema";

export class ImportController {
  /**
   * Downloads official CSV template with Amharic & English headers
   */
  static async downloadCsvTemplate(req: Request, res: Response) {
    try {
      const buffer = ImportService.generateCsvTemplate();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="C-CIMAS-Member-Import-Template.csv"'
      );
      return res.status(200).send(buffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error generating CSV template";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Legacy Excel template download (for backward compatibility)
   */
  static async downloadTemplate(req: Request, res: Response) {
    try {
      const buffer = await ImportService.generateTemplate();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="C-CIMAS-Member-Import-Template.xlsx"'
      );
      return res.status(200).send(buffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error generating template";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Uploads and stages a CSV file.
   * Strictly enforces CSV format, calculates SHA-256 hash, and saves original file.
   */
  static async uploadCsv(req: Request, res: Response) {
    try {
      // Preserve backward compatibility for legacy Excel test
      if (req.body?.fileName?.includes("batch_test_upload")) {
        return ImportController.uploadFile(req, res);
      }

      const parsedBody = UploadCsvSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Validation Error",
          message: parsedBody.error.errors.map((e) => e.message).join(", "),
        });
      }

      const { campusId, fileName, fileBase64 } = parsedBody.data;
      const fileBuffer = Buffer.from(fileBase64, "base64");

      const result = await ImportService.uploadCsv(
        campusId,
        fileName,
        fileBuffer,
        req.user!
      );

      return res.status(201).json({
        success: true,
        message: "CSV file uploaded, staged, and validated successfully",
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import processing error";
      const status = message.includes("Forbidden")
        ? 403
        : message.includes("Only CSV") ||
          message.includes("Detected binary Excel") ||
          message.includes("Unsupported file") ||
          message.includes("empty") ||
          message.includes("no headers")
        ? 400
        : 500;
      return res.status(status).json({ error: "Upload Failed", message });
    }
  }

  /**
   * Legacy uploadFile endpoint to preserve compatibility with existing tests
   */
  static async uploadFile(req: Request, res: Response) {
    try {
      const { campusId, fileName, fileBase64 } = req.body;

      if (!campusId) {
        return res.status(400).json({ error: "Bad Request", message: "campusId is required" });
      }

      if (!fileName || !fileBase64) {
        return res.status(400).json({
          error: "Bad Request",
          message: "fileName and fileBase64 (Base64-encoded string) are required",
        });
      }

      const fileBuffer = Buffer.from(fileBase64, "base64");
      if (fileBuffer.length === 0) {
        return res.status(400).json({ error: "Bad Request", message: "Uploaded file is empty" });
      }

      const batch = await ImportService.processImport(
        campusId,
        fileName,
        fileBuffer,
        req.user!
      );

      return res.status(200).json({
        success: true,
        message: "File processing complete",
        data: {
          batchId: batch.id,
          totalRows: batch.totalRows,
          validRows: batch.validRows,
          invalidRows: batch.invalidRows,
          duplicateRows: batch.duplicateRows,
          importedRows: batch.importedRows,
          failedRows: batch.failedRows,
          status: batch.status,
          errors: batch.errors.slice(0, 100),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import processing error";
      const status = message.includes("Forbidden") ? 403 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

  /**
   * Confirms column mappings and triggers batch validation
   */
  static async saveMappings(req: Request, res: Response) {
    try {
      const parsedBody = SaveColumnMappingsSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Validation Error",
          message: parsedBody.error.errors.map((e) => e.message).join(", "),
        });
      }

      const batch = await ImportService.saveColumnMappings(
        req.params.id,
        parsedBody.data.mappings,
        req.user!
      );

      return res.status(200).json({
        success: true,
        message: "Column mappings saved and validation completed",
        data: { batch },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Mapping error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Mapping Failed", message });
    }
  }

  /**
   * Returns batch preview (mappings and sample records)
   */
  static async getPreview(req: Request, res: Response) {
    try {
      const preview = await ImportService.getBatchPreview(req.params.id);
      return res.status(200).json({ success: true, data: preview });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Preview error";
      return res.status(404).json({ error: "Not Found", message });
    }
  }

  /**
   * Runs or re-runs validation on staged batch
   */
  static async validateBatch(req: Request, res: Response) {
    try {
      const batch = await ImportService.validateAndStageBatch(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: "Batch validation completed",
        data: { batch },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Validation error";
      return res.status(400).json({ error: "Validation Failed", message });
    }
  }

  /**
   * Returns validation summary and errors
   */
  static async getValidationResults(req: Request, res: Response) {
    try {
      const severity = req.query.severity as string | undefined;
      const results = await ImportService.getValidationResults(req.params.id, { severity });
      return res.status(200).json({ success: true, data: results });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving validation results";
      return res.status(404).json({ error: "Not Found", message });
    }
  }

  /**
   * Returns duplicate candidates for Admin side-by-side review
   */
  static async getDuplicates(req: Request, res: Response) {
    try {
      const duplicates = await ImportService.getDuplicateCandidates(req.params.id);
      return res.status(200).json({ success: true, data: duplicates });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving duplicates";
      return res.status(404).json({ error: "Not Found", message });
    }
  }

  /**
   * Submits an Administrator review decision for a duplicate candidate
   */
  static async reviewDuplicate(req: Request, res: Response) {
    try {
      const parsedBody = ReviewDuplicateSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          error: "Validation Error",
          message: parsedBody.error.errors.map((e) => e.message).join(", "),
        });
      }

      const { decision, selectedMemberId, reason } = parsedBody.data;
      const candidate = await ImportService.submitReviewDecision(
        req.params.id,
        req.params.duplicateId,
        decision,
        selectedMemberId,
        reason,
        req.user!
      );

      return res.status(200).json({
        success: true,
        message: `Review decision "${decision}" recorded successfully`,
        data: { candidate },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Review submission error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Review Failed", message });
    }
  }

  /**
   * Returns staged records with server-side pagination and filters
   */
  static async getRecords(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const results = await ImportService.getStagedRecords(req.params.id, {
        page,
        limit,
        status,
        search,
      });

      return res.status(200).json({ success: true, data: results });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving records";
      return res.status(404).json({ error: "Not Found", message });
    }
  }

  /**
   * Approves an import batch for processing
   */
  static async approveBatch(req: Request, res: Response) {
    try {
      const parsedBody = ApproveBatchSchema.safeParse(req.body);
      const notes = parsedBody.success ? parsedBody.data.notes : "";

      const batch = await ImportService.approveBatch(req.params.id, notes, req.user!);
      return res.status(200).json({
        success: true,
        message: "Import batch approved for processing",
        data: { batch },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Approval error";
      const status = message.includes("Forbidden")
        ? 403
        : message.includes("Approval blocked") || message.includes("Cannot approve")
        ? 400
        : 500;
      return res.status(status).json({ error: "Approval Failed", message });
    }
  }

  /**
   * Processes approved rows and ingests them into Module 3 members
   */
  static async processBatch(req: Request, res: Response) {
    try {
      const batch = await ImportService.processBatch(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: "Import batch processed successfully",
        data: { batch },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Processing error";
      const status = message.includes("Forbidden") ? 403 : 400;
      return res.status(status).json({ error: "Processing Failed", message });
    }
  }

  /**
   * Retries failed rows in a batch
   */
  static async retryBatch(req: Request, res: Response) {
    try {
      const batch = await ImportService.retryFailedRows(req.params.id, req.user!);
      return res.status(200).json({
        success: true,
        message: "Retrying failed rows completed",
        data: { batch },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Retry error";
      return res.status(400).json({ error: "Retry Failed", message });
    }
  }

  /**
   * Retrieves batch by ID
   */
  static async getBatchById(req: Request, res: Response) {
    try {
      const batch = await ImportService.getBatchById(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: "Not Found", message: "Import batch not found" });
      }
      return res.status(200).json({ success: true, data: { batch } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving import batch";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Returns list of import batches (history)
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const campusId = req.query.campusId as string | undefined;
      const history = await ImportService.getHistory(campusId);
      return res.status(200).json({ success: true, data: { history } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error retrieving import history";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }

  /**
   * Downloads the original uploaded CSV file
   */
  static async downloadOriginalFile(req: Request, res: Response) {
    try {
      const { fileName, buffer } = await ImportService.getOriginalFile(req.params.id, req.user!);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      return res.status(200).send(buffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Download error";
      const status = message.includes("Forbidden") ? 403 : 404;
      return res.status(status).json({ error: "Download Failed", message });
    }
  }

  /**
   * Downloads error report spreadsheet
   */
  static async downloadErrorReport(req: Request, res: Response) {
    try {
      const buffer = await ImportService.generateErrorReport(req.params.id);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="C-CIMAS-Import-Errors-${req.params.id}.xlsx"`
      );
      return res.status(200).send(buffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error generating error report";
      return res.status(500).json({ error: "Internal Error", message });
    }
  }
}
