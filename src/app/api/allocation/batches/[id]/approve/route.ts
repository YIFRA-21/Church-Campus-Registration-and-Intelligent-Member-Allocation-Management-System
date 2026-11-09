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
    const { approvalNotes, excludedProposalIds = [] } = body;

    const batch = await db.allocationBatch.findUnique({
      where: { id },
      include: {
        proposals: { where: { status: "PROPOSED" } },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (batch.status === "COMMITTED") {
      return NextResponse.json({ error: "Batch has already been committed." }, { status: 400 });
    }

    if (batch.status === "REJECTED" || batch.status === "CANCELLED") {
      return NextResponse.json({ error: `Cannot approve a batch with status ${batch.status}.` }, { status: 400 });
    }

    // Filter out excluded proposals if administrator opted for partial approval
    const approvedProposals = batch.proposals.filter(
      (p) => !excludedProposalIds.includes(p.id)
    );

    if (approvedProposals.length === 0) {
      return NextResponse.json({ error: "No proposals selected for approval." }, { status: 400 });
    }

    // Execute atomic transactional commitment
    await db.$transaction(async (tx) => {
      // 1. Mark batch as COMMITTED
      await tx.allocationBatch.update({
        where: { id: batch.id },
        data: {
          status: "COMMITTED",
          approvedByUserId: user.id,
          approvalNotes: approvalNotes || "Batch approved and committed by administrator.",
          committedAt: new Date(),
        },
      });

      // 2. Mark excluded proposals if any
      if (excludedProposalIds.length > 0) {
        await tx.allocationProposal.updateMany({
          where: { id: { in: excludedProposalIds } },
          data: { status: "EXCLUDED" },
        });

        // Add excluded members to exceptions queue
        for (const p of batch.proposals.filter((p) => excludedProposalIds.includes(p.id))) {
          await tx.allocationException.create({
            data: {
              batchId: batch.id,
              memberId: p.memberId,
              reasonCode: "EXCLUDED_BY_ADMIN",
              reasonDetail: "Excluded during partial approval review by administrator.",
              reviewed: false,
            },
          });
        }
      }

      // 3. Mark approved proposals as COMMITTED
      await tx.allocationProposal.updateMany({
        where: { id: { in: approvedProposals.map((p) => p.id) } },
        data: { status: "COMMITTED" },
      });

      // 4. Create active MemberAllocation records
      for (const proposal of approvedProposals) {
        // Deactivate any pre-existing active allocations just in case
        await tx.memberAllocation.updateMany({
          where: { memberId: proposal.memberId, isActive: true },
          data: { isActive: false, revokedAt: new Date() },
        });

        // Insert new active allocation
        await tx.memberAllocation.create({
          data: {
            memberId: proposal.memberId,
            departmentId: proposal.departmentId,
            batchId: batch.id,
            isActive: true,
            assignedBy: user.id,
            reason: `BATCH_ALLOCATION (${batch.batchNumber}): ${proposal.reasonCode}`,
          },
        });
      }
    });

    await logAudit({
      userId: user.id,
      campusId: batch.campusId,
      action: "ALLOCATION_BATCH_APPROVED",
      entityType: "AllocationBatch",
      entityId: batch.id,
      newValues: {
        batchNumber: batch.batchNumber,
        committedAllocationsCount: approvedProposals.length,
        excludedCount: excludedProposalIds.length,
        approverEmail: user.email,
      },
      reason: approvalNotes || null,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully approved and committed ${approvedProposals.length} member allocations.`,
      committedCount: approvedProposals.length,
    });
  } catch (error: unknown) {
    console.error("Approve batch error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

