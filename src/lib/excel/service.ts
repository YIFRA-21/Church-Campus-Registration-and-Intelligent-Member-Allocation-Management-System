import * as XLSX from "xlsx";
import { db } from "@/lib/db";

export interface ParsedImportRow {
  rowNumber: number;
  fullName: string;
  phoneNumber: string;
  gender: string;
  category: string;
  isDeacon: boolean;
  registrationNo?: string;
  isValid: boolean;
  validationErrors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
}

export interface ExcelImportAnalysis {
  fileName: string;
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: ParsedImportRow[];
}

export function parseExcelBuffer(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
}

export async function validateAndReconcileExcelData(
  rawRows: Record<string, unknown>[],
  campusId: string
): Promise<ExcelImportAnalysis> {
  const existingMembers = await db.member.findMany({
    where: { campusId },
    select: { phoneNumber: true, registrationNo: true, fullName: true },
  });

  const existingPhoneMap = new Map<string, string>();
  const existingRegMap = new Map<string, string>();

  for (const m of existingMembers) {
    if (m.phoneNumber) existingPhoneMap.set(m.phoneNumber.replace(/[\s-]/g, ""), m.fullName);
    if (m.registrationNo) existingRegMap.set(m.registrationNo.toLowerCase().trim(), m.fullName);
  }

  const stagedPhoneSet = new Set<string>();
  const stagedRegSet = new Set<string>();

  const rows: ParsedImportRow[] = [];
  let validCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNumber = i + 2; // considering 1-indexed header

    // Map common headers (case-insensitive)
    const findField = (names: string[]): string => {
      for (const key of Object.keys(raw)) {
        if (names.some((n) => key.toLowerCase().trim() === n.toLowerCase())) {
          return String(raw[key]).trim();
        }
      }
      return "";
    };

    const fullName = findField(["full name", "fullname", "name", "member name"]);
    const phoneNumber = findField(["phone", "phone number", "phonenumber", "telephone", "mobile"]);
    const rawGender = findField(["gender", "sex"]).toUpperCase();
    const category = findField(["category", "member category", "group", "type"]) || "Adult";
    const rawDeacon = findField(["deacon", "is deacon", "deacon status"]).toLowerCase();
    const registrationNo = findField(["registration no", "reg no", "id", "member id"]);

    const validationErrors: string[] = [];

    if (!fullName) {
      validationErrors.push("Full Name is required.");
    }
    if (!phoneNumber) {
      validationErrors.push("Phone Number is required.");
    }

    let gender = "MALE";
    if (rawGender.startsWith("F") || rawGender.includes("FEMALE")) {
      gender = "FEMALE";
    } else if (rawGender.startsWith("M") || rawGender.includes("MALE")) {
      gender = "MALE";
    } else if (rawGender) {
      validationErrors.push(`Unrecognized gender: "${rawGender}". Expected Male or Female.`);
    }

    const isDeacon = ["yes", "true", "1", "y"].includes(rawDeacon);

    // Duplicate detection
    let isDuplicate = false;
    let duplicateReason = "";

    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");
    if (cleanPhone) {
      if (existingPhoneMap.has(cleanPhone)) {
        isDuplicate = true;
        duplicateReason = `Phone number matches existing member: ${existingPhoneMap.get(cleanPhone)}`;
      } else if (stagedPhoneSet.has(cleanPhone)) {
        isDuplicate = true;
        duplicateReason = `Duplicate phone number within this import file.`;
      }
      stagedPhoneSet.add(cleanPhone);
    }

    const cleanReg = registrationNo.toLowerCase().trim();
    if (cleanReg) {
      if (existingRegMap.has(cleanReg)) {
        isDuplicate = true;
        duplicateReason = `Registration ID matches existing member: ${existingRegMap.get(cleanReg)}`;
      } else if (stagedRegSet.has(cleanReg)) {
        isDuplicate = true;
        duplicateReason = `Duplicate Registration ID within this import file.`;
      }
      stagedRegSet.add(cleanReg);
    }

    const isValid = validationErrors.length === 0 && !isDuplicate;

    if (isValid) {
      validCount++;
    } else if (isDuplicate) {
      duplicateCount++;
    } else {
      invalidCount++;
    }

    rows.push({
      rowNumber,
      fullName,
      phoneNumber,
      gender,
      category,
      isDeacon,
      registrationNo: registrationNo || undefined,
      isValid,
      validationErrors,
      isDuplicate,
      duplicateReason,
    });
  }

  return {
    fileName: "import.xlsx",
    totalRows: rawRows.length,
    validCount,
    duplicateCount,
    invalidCount,
    rows,
  };
}

