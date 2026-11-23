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

    // -------------------------------------------------------------------------
    // INTELLIGENT SPREADSHEET HEADER SNIFFING
    // Automatically detects real table header row even when file contains
    // title banners, campus metadata, or summary lines (e.g. Ethiopian church rosters)
    // -------------------------------------------------------------------------
    const knownHeaderKeywords = [
      // Serial / ID / Code
      "ተ.ቁ", "ተ.ቁጥር", "መለያ", "ቁጥር", "no", "sn", "s/n", "serial", "code", "id",
      // Names
      "ሙሉ ስም", "ስም", "የአባት ስም", "የአያት ስም", "first name", "last name", "full name", "name",
      // Christian / Baptismal name
      "ክርስትና ስም", "የክርስትና ስም", "ክርስትና", "baptismal name", "christian name",
      // Gender
      "ጾታ", "gender", "sex",
      // Phone / Contact
      "ስልክ", "ስልክ ቁጥር", "ተንቀሳቃሽ", "phone", "phone number", "mobile", "tel",
      // Department
      "ዲፓርትመንት", "የትምህርት ክፍል", "የትምህርት ዘርፍ", "የአገልግሎት ክፍል", "አገልግሎት", "department", "academic department", "service department", "faculty",
      // Block & Dormitory
      "ብሎክ", "የዶርም ብሎክ", "block", "dorm block",
      "ዶርም", "ክፍል", "የዶርም ቁጥር", "dorm", "dormitory", "room",
      // Language
      "ቋንቋ", "የቋንቋ ችሎታ", "language",
      // Emergency contact
      "የተጠሪ ስም", "ተጠሪ ስም", "ተጠሪ", "contact person", "emergency contact", "contact name",
      "የተጠሪ ስልክ", "ተጠሪ ስልክ", "emergency phone", "contact phone",
      // Sunday school / residence
      "የሰንበት ት/ቤት", "የሰንበት ት/ቤት ቆይታ", "ሰንበት ትምህርት ቤት", "sunday school",
      // Demographics
      "ክልል", "የትውልድ ክልል", "ዞን", "ወረዳ", "ቀበሌ", "region", "zone", "woreda", "kebele",
      "ዕድሜ", "age", "email", "status"
    ];

    let bestHeaderRowIndex = 0;
    let highestScore = -1;

    const maxScanRows = Math.min(rawRows.length, 15);
    for (let rIdx = 0; rIdx < maxScanRows; rIdx++) {
      const candidateRow = rawRows[rIdx];
      const nonEmptyCells = candidateRow.map((c) => c.trim()).filter((c) => c.length > 0);
      if (nonEmptyCells.length === 0) continue;

      let score = 0;
      let keywordMatches = 0;

      for (const cell of nonEmptyCells) {
        const lowerCell = cell.toLowerCase();

        // Heavy penalty for summary/stats banner rows: e.g. "ወንዶች: 12 | ሴቶች: 20 | ዲያቆናት: 0 | ጠቅላላ: 32"
        if (
          cell.includes(":") ||
          cell.includes("|") ||
          lowerCell.includes("ጠቅላላ") ||
          lowerCell.includes("ድምር") ||
          lowerCell.includes("total") ||
          lowerCell.includes("count")
        ) {
          score -= 20;
        }

        // Keyword matches (+12 per keyword)
        for (const kw of knownHeaderKeywords) {
          if (lowerCell === kw || lowerCell.includes(kw)) {
            keywordMatches++;
            score += 12;
            break;
          }
        }
      }

      // Add points for non-empty distinct cells (tables have 4+ columns; title rows usually have 1)
      score += nonEmptyCells.length * 2;

      // Real header rows typically have >= 2 keyword matches
      if (keywordMatches >= 2) {
        score += 30;
      }

      if (score > highestScore) {
        highestScore = score;
        bestHeaderRowIndex = rIdx;
      }
    }

    const headerRowIndex = highestScore >= 10 ? bestHeaderRowIndex : 0;
    const rawHeaderRow = rawRows[headerRowIndex];

    // Find the last non-empty column index to trim trailing blank columns
    let lastNonEmptyCol = -1;
    for (let c = rawHeaderRow.length - 1; c >= 0; c--) {
      if (rawHeaderRow[c] && rawHeaderRow[c].trim().length > 0) {
        lastNonEmptyCol = c;
        break;
      }
    }
    if (lastNonEmptyCol === -1) {
      lastNonEmptyCol = rawHeaderRow.length - 1;
    }

    // Sanitize, name empty columns, and deduplicate headers
    const headers: string[] = [];
    const seenHeaderCounts = new Map<string, number>();

    for (let c = 0; c <= lastNonEmptyCol; c++) {
      let h = (rawHeaderRow[c] || "").trim();
      if (!h) {
        h = `Column_${c + 1}`;
      }
      if (seenHeaderCounts.has(h)) {
        const count = seenHeaderCounts.get(h)! + 1;
        seenHeaderCounts.set(h, count);
        h = `${h}_${count}`;
      } else {
        seenHeaderCounts.set(h, 1);
      }
      headers.push(h);
    }

    // Slice data rows below header and filter out empty or trailing summary rows
    const rawDataRows = rawRows.slice(headerRowIndex + 1);
    const dataRows: string[][] = [];
    const rows: Record<string, string>[] = [];

    for (const r of rawDataRows) {
      const hasData = r.slice(0, headers.length).some((cell) => cell && cell.trim().length > 0);
      if (!hasData) continue;

      const firstCell = (r[0] || "").trim().toLowerCase();
      if (
        firstCell.startsWith("ድምር") ||
        firstCell.startsWith("ጠቅላላ") ||
        firstCell.startsWith("total")
      ) {
        continue;
      }

      const rowSlice: string[] = [];
      const rowObj: Record<string, string> = {};

      for (let c = 0; c < headers.length; c++) {
        const val = r[c] !== undefined ? r[c].trim() : "";
        rowSlice.push(val);
        rowObj[headers[c]] = val;
      }

      dataRows.push(rowSlice);
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
