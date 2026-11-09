import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/types";
import { parseExcelBuffer, validateAndReconcileExcelData } from "@/lib/excel/service";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, PERMISSIONS.MEMBER_IMPORT_EXCEL)) {
      return NextResponse.json({ error: "Forbidden: Requires member.import_excel permission" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const campusId = (formData.get("campusId") as string) || user.campusId;
    const commit = formData.get("commit") === "true";

    if (!file) {
      return NextResponse.json({ error: "No Excel file uploaded." }, { status: 400 });
    }

    if (!campusId) {
      return NextResponse.json({ error: "Campus ID is required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse spreadsheet rows
    const rawRows = parseExcelBuffer(buffer);

    // 2. Validate, check duplicates, reconcile
    const analysis = await validateAndReconcileExcelData(rawRows, campusId);

    // If commit=false, return preview only
    if (!commit) {
      return NextResponse.json({
        success: true,
        preview: true,
        analysis,
      });
    }

    // 3. Commit valid, non-duplicate rows inside database transaction
    const validRowsToInsert = analysis.rows.filter((r) => r.isValid && !r.isDuplicate);

    if (validRowsToInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid, non-duplicate rows found in file to commit." },
        { status: 400 }
      );
    }

    let currentCount = await db.member.count({ where: { campusId } });

    const createdMembers = await db.$transaction(
      validRowsToInsert.map((row) => {
        currentCount++;
        const regNo = row.registrationNo || `REG-${currentCount.toString().padStart(5, "0")}`;
        return db.member.create({
          data: {
            campusId,
            registrationNo: regNo,
            fullName: row.fullName,
            phoneNumber: row.phoneNumber,
            gender: row.gender,
            category: row.category,
            isDeacon: row.isDeacon,
            status: "ACTIVE",
          },
        });
      })
    );

    // Save Import Batch Record
    await db.importBatch.create({
      data: {
        campusId,
        fileName: file.name,
        totalRows: analysis.totalRows,
        validRows: validRowsToInsert.length,
        duplicateRows: analysis.duplicateCount,
        rejectedRows: analysis.invalidCount,
        status: "COMMITTED",
        uploadedBy: user.id,
      },
    });

    await logAudit({
      userId: user.id,
      campusId,
      action: "EXCEL_IMPORT_COMMITTED",
      entityType: "ImportBatch",
      entityId: file.name,
      newValues: {
        totalRows: analysis.totalRows,
        importedCount: createdMembers.length,
        duplicateCount: analysis.duplicateCount,
        invalidCount: analysis.invalidCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdMembers.length} new members.`,
      analysis,
    });
  } catch (error: unknown) {
    console.error("POST import error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

