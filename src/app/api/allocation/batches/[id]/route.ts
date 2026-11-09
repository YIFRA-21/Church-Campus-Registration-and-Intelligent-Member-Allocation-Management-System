import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const batch = await db.allocationBatch.findUnique({
      where: { id },
      include: {
        campus: true,
        creator: { select: { fullName: true, email: true } },
        approver: { select: { fullName: true, email: true } },
        proposals: {
          include: {
            member: {
              select: {
                id: true,
                registrationNo: true,
                fullName: true,
                gender: true,
                category: true,
                isDeacon: true,
                phoneNumber: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                targetPercent: true,
                maxCapacity: true,
              },
            },
          },
        },
        exceptions: {
          include: {
            member: {
              select: {
                id: true,
                registrationNo: true,
                fullName: true,
                gender: true,
                category: true,
                isDeacon: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    let calculationMeta = null;
    if (batch.calculationMeta) {
      try {
        calculationMeta = JSON.parse(batch.calculationMeta);
      } catch {
        calculationMeta = null;
      }
    }

    return NextResponse.json({
      batch: {
        ...batch,
        calculationMeta,
      },
    });
  } catch (error) {
    console.error("GET batch detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

