import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
  totalRows: number;
  checksum: string;
}

export class CsvParser {
  /**
   * Validates that the file buffer is strictly CSV and not an Excel file or other binary format.
   * Throws a helpful, human-readable error when an Excel or unsupported file is detected.
   */
  static validateCsvFile(fileName: string, buffer: Buffer): void {
    const ext = path.extname(fileName).toLowerCase();

    // Check file extension
    if (ext === ".xlsx" || ext === ".xls" || ext === ".xlsm" || ext === ".ods") {
      throw new Error(
        "Only CSV (.csv) files are supported for import. Uploading Excel (.xlsx/.xls) spreadsheets is not permitted. Please save your file as UTF-8 CSV before uploading."
      );
    }

    if (ext !== ".csv" && ext !== ".txt") {
      throw new Error(
        `Unsupported file format "${ext}". Only CSV (.csv) files encoded in UTF-8 are supported.`
      );
    }

    // Check magic bytes:
    // ZIP / XLSX / DOCX magic bytes: 0x50 0x4B 0x03 0x04 ('PK\x03\x04')
    if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      throw new Error(
        "Detected binary Excel (.xlsx) file. Only plain-text CSV (.csv) files are supported. Please save your spreadsheet as CSV (Comma delimited) (*.csv) and retry."
      );
    }

    // OLE / legacy XLS magic bytes: 0xD0 0xCF 0x11 0xE0
    if (buffer.length >= 4 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
      throw new Error(
        "Detected legacy binary Excel (.xls) file. Only plain-text CSV (.csv) files are supported. Please save your spreadsheet as CSV (Comma delimited) (*.csv) and retry."
      );
    }
  }

  /**
   * Computes the SHA-256 checksum of the file buffer
   */
  static computeChecksum(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Strips UTF-8 BOM (Byte Order Mark) if present and converts buffer to string
   */
  static bufferToUtf8String(buffer: Buffer): string {
    // Check for UTF-8 BOM: 0xEF, 0xBB, 0xBF
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      buffer = buffer.subarray(3);
    }
    let text = buffer.toString("utf8");
    // Strip Unicode BOM character if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    return text;
  }

  /**
   * RFC 4180 compliant CSV parser with multiline, escaped quotes, and Amharic Unicode support.
   */
  static parse(buffer: Buffer): ParsedCsvResult {
    const checksum = this.computeChecksum(buffer);
    const text = this.bufferToUtf8String(buffer);

    if (!text.trim()) {
      return {
        headers: [],
        rows: [],
        rawRows: [],
        totalRows: 0,
        checksum,
      };
    }

    const rawRows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // Toggle quote mode
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if ((char === "\r" || char === "\n") && !insideQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++; // Skip Windows CRLF
        }
        currentRow.push(currentField.trim());
        currentField = "";

        // Only add non-empty rows
        if (currentRow.some((field) => field.length > 0)) {
          rawRows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }

    // Flush last field and row if any
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rawRows.push(currentRow);
      }
    }

    if (rawRows.length === 0) {
      return {
        headers: [],
        rows: [],
        rawRows: [],
        totalRows: 0,
        checksum,
      };
    }

    const headers = rawRows[0].map((h) => h.trim());
    const dataRows = rawRows.slice(1);

    const rows: Record<string, string>[] = [];
    for (const r of dataRows) {
      const rowObj: Record<string, string> = {};
      for (let c = 0; c < headers.length; c++) {
        const header = headers[c];
        rowObj[header] = r[c] !== undefined ? r[c] : "";
      }
      rows.push(rowObj);
    }

    return {
      headers,
      rows,
      rawRows: dataRows,
      totalRows: rows.length,
      checksum,
    };
  }

  /**
   * Sanitizes field against CSV formula injection when exporting or previewing
   */
  static sanitizeForCsv(value: string): string {
    if (!value) return "";
    const trimmed = value.trim();
    if (
      trimmed.startsWith("=") ||
      trimmed.startsWith("+") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("@") ||
      trimmed.startsWith("\t") ||
      trimmed.startsWith("\r")
    ) {
      return `'${trimmed}`;
    }
    return trimmed;
  }
}
