import { Request, Response } from "express";
import { ImportService } from "../services/import.service";

export class ImportController {
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
          errors: batch.errors.slice(0, 100), // Preview first 100 errors in JSON response
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import processing error";
      const status = message.includes("Forbidden") ? 403 : 500;
      return res.status(status).json({ error: "Request Failed", message });
    }
  }

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
      const status = message.includes("not found") ? 404 : 500;
      return res.status(status).json({ error: "Report Failed", message });
    }
  }
}

