import ExcelJS from "exceljs";
import { MemberService } from "./member.service";
import { CreateMemberInput, Gender, MemberCategory, SpiritualStatus } from "../schemas/member.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";

export interface ImportErrorRecord {
  rowNumber: number;
  memberId: string;
  fieldName: string;
  errorMessage: string;
  rawData: Record<string, unknown>;
}

export interface ImportBatchRecord {
  id: string;
  campusId: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  failedRows: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errors: ImportErrorRecord[];
  importedBy: string;
  createdAt: string;
  completedAt?: string;
}

let importBatchesStore: ImportBatchRecord[] = [];

export class ImportService {
  /**
   * Generates a standardized, beautifully styled Excel template for member import
   */
  static async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "C-CIMAS Church Campus Management";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Member Registration");

    // Define all 17 standardized columns matching the official Church Campus Roster
    sheet.columns = [
      { header: "ተ.ቁ (Member ID)*", key: "memberId", width: 20 },
      { header: "ሙሉ ስም (Full Name)*", key: "fullName", width: 24 },
      { header: "ክርስትና ስም (Baptismal Name)", key: "christianName", width: 22 },
      { header: "ጾታ (Gender: MALE/FEMALE)*", key: "gender", width: 24 },
      { header: "ስልክ ቁጥር (Phone Number)", key: "phoneNumber", width: 20 },
      { header: "ዲፓርትመንት (Academic Dept)", key: "academicDepartment", width: 26 },
      { header: "የመጡበት ክልል (Origin Region)", key: "originRegion", width: 22 },
      { header: "ዞን (Zone)", key: "zone", width: 18 },
      { header: "ወረዳ (Woreda)", key: "woreda", width: 18 },
      { header: "ቀበሌ (Kebele)", key: "kebele", width: 18 },
      { header: "ብሎክ (Dorm Block)", key: "dormBlock", width: 16 },
      { header: "ዶርም (Dorm Room)", key: "dormRoom", width: 16 },
      { header: "ቋንቋ (Language)", key: "language", width: 18 },
      { header: "የተጠሪ ስም (Emergency Contact)", key: "emergencyContactName", width: 24 },
      { header: "የተጠሪ ስልክ (Emergency Phone)", key: "emergencyContactPhone", width: 22 },
      { header: "የሰንበት ት/ቤት ቆይታ (Sunday School)", key: "sundaySchoolDuration", width: 26 },
      { header: "ዕድሜ (Age)", key: "age", width: 14 },
      { header: "ሁኔታ (Status: ACTIVE/INACTIVE/SUSPENDED)", key: "status", width: 26 },
    ];

    // Style header row with C-CIMAS Deep Teal (#0d5b61)
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D5B61" }, // C-CIMAS Deep Teal matching the official UI
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    // Add illustrative sample rows
    sheet.addRow({
      memberId: "MK-AA-101",
      fullName: "ዮሐንስ ተስፋዬ",
      christianName: "ኃይለ ማርያም",
      gender: "MALE",
      phoneNumber: "+251911223344",
      academicDepartment: "ኮምፒውተር ሳይንስ (Computer Science)",
      originRegion: "አዲስ አበባ",
      zone: "የካ ክፍለ ከተማ",
      woreda: "ወረዳ 08",
      kebele: "ቀበሌ 12",
      dormBlock: "B-04",
      dormRoom: "R-204",
      language: "አማርኛ",
      emergencyContactName: "አቶ ተስፋዬ ገብሬ",
      emergencyContactPhone: "+251911998877",
      sundaySchoolDuration: "4 ዓመት",
      age: 22,
      status: "ACTIVE",
    });

    sheet.addRow({
      memberId: "MK-AA-102",
      fullName: "ማርታ ከበደ",
      christianName: "ወለተ ዮሐንስ",
      gender: "FEMALE",
      phoneNumber: "+251922334455",
      academicDepartment: "ሥነ ሕንፃ (Architecture)",
      originRegion: "አማራ",
      zone: "ደቡብ ጎንደር",
      woreda: "ደብረ ታቦር",
      kebele: "ቀበሌ 03",
      dormBlock: "B-12",
      dormRoom: "R-108",
      language: "አማርኛ",
      emergencyContactName: "ወ/ሮ ሙሉነሽ ዓለሙ",
      emergencyContactPhone: "+251922887766",
      sundaySchoolDuration: "3 ዓመት",
      age: 21,
      status: "ACTIVE",
    });

    sheet.addRow({
      memberId: "MK-AA-103",
      fullName: "ዳዊት ዓለሙ",
      christianName: "ተክለ ሃይማኖት",
      gender: "MALE",
      phoneNumber: "+251933445566",
      academicDepartment: "ኤሌክትሪካል ምህንድስና (Electrical Engineering)",
      originRegion: "ኦሮሚያ",
      zone: "ሸገር ከተማ",
      woreda: "ሱሉልታ",
      kebele: "ቀበሌ 02",
      dormBlock: "B-06",
      dormRoom: "R-312",
      language: "አፋን ኦሮሞ / አማርኛ",
      emergencyContactName: "አቶ ዓለሙ በቀለ",
      emergencyContactPhone: "+251933776655",
      sundaySchoolDuration: "5 ዓመት",
      age: 23,
      status: "ACTIVE",
    });

    // Instructions worksheet
    const infoSheet = workbook.addWorksheet("Instructions & Rules");
    infoSheet.columns = [
      { header: "Field Name", key: "field", width: 22 },
      { header: "Requirement", key: "req", width: 16 },
      { header: "Allowed Values / Validation Rule", key: "rule", width: 60 },
    ];
    const infoHeader = infoSheet.getRow(1);
    infoHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    infoHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };

    infoSheet.addRows([
      { field: "Member ID", req: "MANDATORY", rule: "Must be unique across all imported members." },
      { field: "First Name", req: "MANDATORY", rule: "Full legal first name." },
      { field: "Last Name", req: "MANDATORY", rule: "Full family or legal grandfather name." },
      { field: "Gender", req: "MANDATORY", rule: "Must be exactly MALE or FEMALE." },
      { field: "Phone Number", req: "OPTIONAL", rule: "Valid mobile phone number with country code preferred." },
      { field: "Email", req: "OPTIONAL", rule: "Valid standard email address format." },
      { field: "Category", req: "OPTIONAL", rule: "YOUTH, ADULT, ELDER, STUDENT, CHILDREN, or YOUNG_ADULT (default: ADULT)." },
      { field: "Spiritual Status", req: "OPTIONAL", rule: "DEACON, SERVANT, or REGULAR (default: REGULAR)." },
      { field: "Education Level", req: "OPTIONAL", rule: "Highest completed or ongoing educational degree." },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Process and validate imported buffer (.xlsx or .csv) with chunked batch processing
   */
  static async processImport(
    campusId: string,
    fileName: string,
    fileBuffer: Buffer,
    currentUser: AuthSessionPayload
  ): Promise<ImportBatchRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can perform bulk Excel imports");
    }

    const batchId = `b0000000-0000-0000-0000-${(importBatchesStore.length + 1).toString().padStart(12, "0")}`;
    const batchRecord: ImportBatchRecord = {
      id: batchId,
      campusId,
      fileName,
      fileSize: fileBuffer.length,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      importedRows: 0,
      failedRows: 0,
      status: "PROCESSING",
      errors: [],
      importedBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    // Load workbook
    const workbook = new ExcelJS.Workbook();
    try {
      if (fileName.toLowerCase().endsWith(".csv")) {
        // Parse CSV stream
        const stream = require("stream");
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);
        await workbook.csv.read(bufferStream);
      } else {
        await workbook.xlsx.load(fileBuffer);
      }
    } catch (parseErr: unknown) {
      batchRecord.status = "FAILED";
      batchRecord.errors.push({
        rowNumber: 0,
        memberId: "FILE_ERROR",
        fieldName: "file",
        errorMessage: `Failed to parse spreadsheet file: ${parseErr instanceof Error ? parseErr.message : "Invalid format"}`,
        rawData: {},
      });
      importBatchesStore.push(batchRecord);
      return batchRecord;
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      batchRecord.status = "FAILED";
      batchRecord.errors.push({
        rowNumber: 0,
        memberId: "NO_SHEET",
        fieldName: "worksheet",
        errorMessage: "Workbook does not contain any valid worksheets",
        rawData: {},
      });
      importBatchesStore.push(batchRecord);
      return batchRecord;
    }

    // Determine header column mappings dynamically (supporting both Amharic & English headers)
    const headerMap: Record<string, number> = {};
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      const val = cell.text.toLowerCase().trim();
      if (val.includes("ተ.ቁ") || val.includes("member id") || val.includes("member_id") || val.includes("code")) {
        headerMap["memberId"] = colNumber;
      } else if (val.includes("ሙሉ ስም") || val.includes("full name")) {
        headerMap["fullName"] = colNumber;
      } else if (val.includes("first name") || val.includes("first_name")) {
        headerMap["firstName"] = colNumber;
      } else if (val.includes("last name") || val.includes("last_name") || val.includes("የአባት ስም")) {
        headerMap["lastName"] = colNumber;
      } else if (val.includes("ክርስትና ስም") || val.includes("christian") || val.includes("baptismal")) {
        headerMap["christianName"] = colNumber;
      } else if (val.includes("ጾታ") || val.includes("gender") || val.includes("sex")) {
        headerMap["gender"] = colNumber;
      } else if (val.includes("ስልክ ቁጥር") || (val.includes("ስልክ") && !val.includes("የተጠሪ")) || (val.includes("phone") && !val.includes("emergency"))) {
        headerMap["phoneNumber"] = colNumber;
      } else if (val.includes("ዲፓርትመንት") || val.includes("department") || val.includes("dept") || val.includes("faculty")) {
        headerMap["academicDepartment"] = colNumber;
      } else if (val.includes("ክልል") || val.includes("region") || val.includes("origin")) {
        headerMap["originRegion"] = colNumber;
      } else if (val.includes("ዞን") || val.includes("zone")) {
        headerMap["zone"] = colNumber;
      } else if (val.includes("ወረዳ") || val.includes("woreda")) {
        headerMap["woreda"] = colNumber;
      } else if (val.includes("ቀበሌ") || val.includes("kebele")) {
        headerMap["kebele"] = colNumber;
      } else if (val.includes("ብሎክ") || val.includes("block")) {
        headerMap["dormBlock"] = colNumber;
      } else if (val.includes("ዶርም") || val.includes("dorm") || val.includes("room")) {
        headerMap["dormRoom"] = colNumber;
      } else if (val.includes("ቋንቋ") || val.includes("language")) {
        headerMap["language"] = colNumber;
      } else if (val.includes("የተጠሪ ስም") || val.includes("emergency contact name") || val.includes("sponsor")) {
        headerMap["emergencyContactName"] = colNumber;
      } else if (val.includes("የተጠሪ ስልክ") || val.includes("emergency phone") || val.includes("emergency contact phone")) {
        headerMap["emergencyContactPhone"] = colNumber;
      } else if (val.includes("ሰንበት") || val.includes("sunday school") || val.includes("ቆይታ")) {
        headerMap["sundaySchoolDuration"] = colNumber;
      } else if (val.includes("ዕድሜ") || val.includes("age")) {
        headerMap["age"] = colNumber;
      } else if (val.includes("email") || val.includes("ኢሜይል")) {
        headerMap["email"] = colNumber;
      } else if (val.includes("category") || val.includes("ዘርፍ")) {
        headerMap["category"] = colNumber;
      } else if (val.includes("spiritual") || val.includes("መንፈሳዊ")) {
        headerMap["spiritualStatus"] = colNumber;
      } else if (val.includes("education") || val.includes("ትምህርት ደረጃ")) {
        headerMap["educationLevel"] = colNumber;
      } else if (val.includes("address") || val.includes("አድራሻ")) {
        headerMap["address"] = colNumber;
      } else if (val.includes("emergency") && !headerMap["emergencyContact"]) {
        headerMap["emergencyContact"] = colNumber;
      } else if (val.includes("ሁኔታ") || val.includes("status")) {
        headerMap["status"] = colNumber;
      }
    });

    // Fallbacks if standard columns 1..18
    if (!headerMap["memberId"]) headerMap["memberId"] = 1;
    if (!headerMap["fullName"] && !headerMap["firstName"]) headerMap["fullName"] = 2;
    if (!headerMap["christianName"]) headerMap["christianName"] = 3;
    if (!headerMap["gender"]) headerMap["gender"] = 4;
    if (!headerMap["phoneNumber"]) headerMap["phoneNumber"] = 5;
    if (!headerMap["academicDepartment"]) headerMap["academicDepartment"] = 6;
    if (!headerMap["originRegion"]) headerMap["originRegion"] = 7;
    if (!headerMap["zone"]) headerMap["zone"] = 8;
    if (!headerMap["woreda"]) headerMap["woreda"] = 9;
    if (!headerMap["kebele"]) headerMap["kebele"] = 10;
    if (!headerMap["dormBlock"]) headerMap["dormBlock"] = 11;
    if (!headerMap["dormRoom"]) headerMap["dormRoom"] = 12;
    if (!headerMap["language"]) headerMap["language"] = 13;
    if (!headerMap["emergencyContactName"]) headerMap["emergencyContactName"] = 14;
    if (!headerMap["emergencyContactPhone"]) headerMap["emergencyContactPhone"] = 15;
    if (!headerMap["sundaySchoolDuration"]) headerMap["sundaySchoolDuration"] = 16;
    if (!headerMap["age"]) headerMap["age"] = 17;

    const validMemberInputs: CreateMemberInput[] = [];
    const fileMemberIds = new Set<string>();

    const rowCount = worksheet.rowCount;
    batchRecord.totalRows = Math.max(0, rowCount - 1); // exclude header row

    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row || !row.hasValues) continue;

      const getCellText = (key: string): string => {
        const col = headerMap[key];
        if (!col) return "";
        const cell = row.getCell(col);
        return cell && cell.text ? cell.text.trim() : "";
      };

      const memberId = getCellText("memberId");
      let firstName = getCellText("firstName");
      let lastName = getCellText("lastName");
      const fullName = getCellText("fullName");

      if (fullName && (!firstName || !lastName)) {
        const parts = fullName.split(/\s+/).filter(Boolean);
        if (parts.length > 0) {
          firstName = parts[0];
          lastName = parts.slice(1).join(" ") || "—";
        }
      }

      const christianName = getCellText("christianName");
      const genderRaw = getCellText("gender").toUpperCase();
      const phoneNumber = getCellText("phoneNumber");
      const email = getCellText("email");
      const academicDepartment = getCellText("academicDepartment");
      const originRegion = getCellText("originRegion");
      const zone = getCellText("zone");
      const woreda = getCellText("woreda");
      const kebele = getCellText("kebele");
      const dormBlock = getCellText("dormBlock");
      const dormRoom = getCellText("dormRoom");
      const language = getCellText("language");
      const emergencyContactName = getCellText("emergencyContactName");
      const emergencyContactPhone = getCellText("emergencyContactPhone");
      const sundaySchoolDuration = getCellText("sundaySchoolDuration");
      const ageRaw = getCellText("age");
      const age = ageRaw && !isNaN(parseInt(ageRaw, 10)) ? parseInt(ageRaw, 10) : undefined;
      const statusRaw = getCellText("status").toUpperCase();
      const categoryRaw = getCellText("category").toUpperCase();
      const spiritualRaw = getCellText("spiritualStatus").toUpperCase();
      const educationLevel = getCellText("educationLevel") || academicDepartment;
      const address = getCellText("address") || [originRegion, zone, woreda, kebele].filter(Boolean).join(", ");
      const emergencyContact = getCellText("emergencyContact") || [emergencyContactName, emergencyContactPhone].filter(Boolean).join(" - ");

      const rawData = {
        memberId,
        firstName,
        lastName,
        fullName,
        christianName,
        gender: genderRaw,
        phoneNumber,
        academicDepartment,
        originRegion,
        zone,
        woreda,
        kebele,
        dormBlock,
        dormRoom,
        language,
        emergencyContactName,
        emergencyContactPhone,
        sundaySchoolDuration,
        age,
      };

      // 1. Validate Required Fields
      if (!memberId) {
        batchRecord.invalidRows++;
        batchRecord.errors.push({
          rowNumber,
          memberId: "UNKNOWN",
          fieldName: "memberId",
          errorMessage: "Member ID (ተ.ቁ) is required",
          rawData,
        });
        continue;
      }

      if (!firstName) {
        batchRecord.invalidRows++;
        batchRecord.errors.push({
          rowNumber,
          memberId,
          fieldName: "firstName",
          errorMessage: "First name / Full name (ሙሉ ስም) is required",
          rawData,
        });
        continue;
      }

      if (!lastName) {
        if (!fullName) {
          batchRecord.invalidRows++;
          batchRecord.errors.push({
            rowNumber,
            memberId,
            fieldName: "lastName",
            errorMessage: "Last name is required",
            rawData,
          });
          continue;
        }
        lastName = "—";
      }

      // 2. Validate Gender
      let gender: Gender = "MALE";
      if (genderRaw === "FEMALE" || genderRaw === "F" || genderRaw.startsWith("ሴ")) {
        gender = "FEMALE";
      } else if (genderRaw === "MALE" || genderRaw === "M" || genderRaw.startsWith("ወ")) {
        gender = "MALE";
      } else {
        batchRecord.invalidRows++;
        batchRecord.errors.push({
          rowNumber,
          memberId,
          fieldName: "gender",
          errorMessage: `Invalid gender "${genderRaw}". Must be MALE or FEMALE (ወንድ ወይም ሴት).`,
          rawData,
        });
        continue;
      }

      // 3. Duplicate Member ID check within file
      const lowerMemberId = memberId.toLowerCase();
      if (fileMemberIds.has(lowerMemberId)) {
        batchRecord.duplicateRows++;
        batchRecord.errors.push({
          rowNumber,
          memberId,
          fieldName: "memberId",
          errorMessage: `Duplicate Member ID "${memberId}" detected within the uploaded file.`,
          rawData,
        });
        continue;
      }
      fileMemberIds.add(lowerMemberId);

      // 4. Validate Category
      let category: MemberCategory = "STUDENT";
      if (categoryRaw.includes("YOUTH") || categoryRaw.includes("ወጣት")) category = "YOUTH";
      else if (categoryRaw.includes("STUDENT") || categoryRaw.includes("ተማሪ")) category = "STUDENT";
      else if (categoryRaw.includes("ELDER") || categoryRaw.includes("አረጋዊ")) category = "ELDER";
      else if (categoryRaw.includes("CHILD") || categoryRaw.includes("ህፃን")) category = "CHILDREN";
      else if (categoryRaw.includes("YOUNG")) category = "YOUNG_ADULT";
      else category = "STUDENT";

      // 5. Validate Spiritual Status
      let spiritualStatus: SpiritualStatus = "REGULAR";
      if (spiritualRaw.includes("DEACON") || spiritualRaw.includes("ዲያቆን")) spiritualStatus = "DEACON";
      else if (spiritualRaw.includes("SERVANT") || spiritualRaw.includes("አገልጋይ")) spiritualStatus = "SERVANT";
      else spiritualStatus = "REGULAR";

      // 6. Validate Member Status
      let status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ON_HOLD" = "ACTIVE";
      if (statusRaw.includes("INACTIVE") || statusRaw.includes("ቦዘኔ")) status = "INACTIVE";
      else if (statusRaw.includes("SUSPENDED") || statusRaw.includes("የታገደ") || statusRaw.includes("እገዳ")) status = "SUSPENDED";
      else status = "ACTIVE";

      validMemberInputs.push({
        campusId,
        memberId,
        firstName,
        lastName,
        christianName: christianName || undefined,
        gender,
        phoneNumber,
        email: email || undefined,
        academicDepartment: academicDepartment || undefined,
        originRegion: originRegion || undefined,
        zone: zone || undefined,
        woreda: woreda || undefined,
        kebele: kebele || undefined,
        dormBlock: dormBlock || undefined,
        dormRoom: dormRoom || undefined,
        language: language || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        sundaySchoolDuration: sundaySchoolDuration || undefined,
        age,
        category,
        spiritualStatus,
        educationLevel,
        address,
        emergencyContact,
        status,
      });

      batchRecord.validRows++;
    }

    // 6. Chunked Database Batch Ingestion (e.g. 500 rows per chunk)
    const CHUNK_SIZE = 500;
    for (let i = 0; i < validMemberInputs.length; i += CHUNK_SIZE) {
      const chunk = validMemberInputs.slice(i, i + CHUNK_SIZE);
      const { inserted, skippedDuplicates } = await MemberService.batchCreate(chunk, currentUser);
      batchRecord.importedRows += inserted;
      batchRecord.duplicateRows += skippedDuplicates;
    }

    batchRecord.failedRows = batchRecord.invalidRows + batchRecord.duplicateRows;
    batchRecord.status = batchRecord.errors.length > 0 && batchRecord.importedRows === 0 ? "FAILED" : "COMPLETED";
    batchRecord.completedAt = new Date().toISOString();

    importBatchesStore.unshift(batchRecord);
    return batchRecord;
  }

  static async getHistory(campusId?: string): Promise<ImportBatchRecord[]> {
    if (campusId) {
      return importBatchesStore.filter((b) => b.campusId === campusId);
    }
    return importBatchesStore;
  }

  static async getBatchById(id: string): Promise<ImportBatchRecord | null> {
    const found = importBatchesStore.find((b) => b.id === id);
    return found || null;
  }

  /**
   * Generates an Excel error report spreadsheet containing all failed rows and reasons
   */
  static async generateErrorReport(batchId: string): Promise<Buffer> {
    const batch = await this.getBatchById(batchId);
    if (!batch) {
      throw new Error("Import batch record not found");
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Import Errors");

    sheet.columns = [
      { header: "Row #", key: "rowNumber", width: 10 },
      { header: "Member ID", key: "memberId", width: 18 },
      { header: "Field Name", key: "fieldName", width: 16 },
      { header: "Error Reason", key: "errorMessage", width: 45 },
      { header: "Raw Row Data", key: "rawData", width: 50 },
    ];

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDC2626" }, // Red
    };

    batch.errors.forEach((err) => {
      sheet.addRow({
        rowNumber: err.rowNumber,
        memberId: err.memberId,
        fieldName: err.fieldName,
        errorMessage: err.errorMessage,
        rawData: JSON.stringify(err.rawData),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

