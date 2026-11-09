import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/types";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, PERMISSIONS.ALLOCATION_APPROVE)) {
      return NextResponse.json({ error: "Forbidden: Requires allocation.approve capability" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { rejectionReason } = body;

    const batch = await db.allocationBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (batch.status === "COMMITTED") {
      return NextResponse.json({ error: "Cannot reject an already committed batch." }, { status: 400 });
    }

    await db.allocationBatch.update({
      where: { id: batch.id },
      data: {
        status: "REJECTED",
        approvedByUserId: user.id,
        approvalNotes: rejectionReason || "Allocation proposal rejected by administrator.",
      },
    });

    await db.allocationProposal.updateMany({
      where: { batchId: batch.id },
      data: { status: "REJECTED" },
    });

    await logAudit({
      userId: user.id,
      campusId: batch.campusId,
      action: "ALLOCATION_BATCH_REJECTED",
      entityType: "AllocationBatch",
      entityId: batch.id,
      newValues: { batchNumber: batch.batchNumber, status: "REJECTED" },
      reason: rejectionReason || null,
    });

    return NextResponse.json({
      success: true,
      message: "Batch proposal successfully rejected. No active allocations were modified.",
    });
  } catch (error: unknown) {
    console.error("Reject batch error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

