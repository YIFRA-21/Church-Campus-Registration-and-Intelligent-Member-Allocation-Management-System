import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 6, 8 & 9: Intelligent Member Allocation & Exception Management Tests", () => {
  let adminToken: string;
  let evaluatorToken: string;
  const campusId = "a0000000-0000-0000-0000-000000000001"; // Main Campus

  it("authenticates admin and evaluator accounts", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    adminToken = adminRes.body.data.token;

    const evalRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "evaluator@c-cimas.org", password: "admin123" });
    evaluatorToken = evalRes.body.data.token;
  });

  it("ensures target percentages sum to 100% on Main Campus before running allocation", async () => {
    const deptsRes = await request(app)
      .get(`/api/v1/departments?campusId=${campusId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const depts = deptsRes.body.data.departments.slice(0, 5);

    await request(app)
      .post("/api/v1/departments/targets/configure")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId,
        cycleName: "2026 Allocation Cycle",
        targets: [
          { departmentId: depts[0].id, percentage: 30.0 },
          { departmentId: depts[1].id, percentage: 25.0 },
          { departmentId: depts[2].id, percentage: 20.0 },
          { departmentId: depts[3].id, percentage: 15.0 },
          { departmentId: depts[4].id, percentage: 10.0 },
        ],
      });
  });

  let activeBatchId: string;

  it("executes intelligent allocation: 100% accounting (Option A) with no silent exclusions", async () => {
    const runRes = await request(app)
      .post("/api/v1/allocations/run")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId,
        cycleName: "2026/2027 Main Campus Annual Allocation",
      });

    expect(runRes.status).toBe(201);
    expect(runRes.body.success).toBe(true);

    const batch = runRes.body.data.batch;
    activeBatchId = batch.id;
    expect(batch.status).toBe("PREVIEW_READY");
    expect(batch.totalMembers).toBeGreaterThanOrEqual(1);

    // Option A strict validation: allocated + exceptions = total members
    expect(batch.allocatedCount + batch.exceptionCount).toBe(batch.totalMembers);
  });

  it("prohibits duplicate assignments: each member is allocated at most once per cycle", async () => {
    const allocationsRes = await request(app)
      .get(`/api/v1/allocations/batches/${activeBatchId}/allocations`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(allocationsRes.status).toBe(200);
    const allocations = allocationsRes.body.data.allocations;

    const memberIds = allocations.map((a: { memberId: string }) => a.memberId);
    const uniqueIds = new Set(memberIds);
    expect(uniqueIds.size).toBe(memberIds.length); // Strict 1:1 uniqueness
  });

  it("enforces Rule 13: Unresolved exceptions strictly block final allocation approval", async () => {
    // If there are pending exceptions, approval must fail with clear error
    const exceptionsRes = await request(app)
      .get(`/api/v1/allocations/batches/${activeBatchId}/exceptions?status=PENDING`)
      .set("Authorization", `Bearer ${adminToken}`);

    const pendingCount = exceptionsRes.body.data.exceptions.length;

    if (pendingCount > 0) {
      const approveRes = await request(app)
        .post("/api/v1/allocations/approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ batchId: activeBatchId });

      expect(approveRes.status).toBe(400);
      expect(approveRes.body.error).toBe("Approval Failed");
      expect(approveRes.body.message).toContain("unresolved exceptions");
    }
  });

  it("resolves exceptions with documented justifications and allows approval", async () => {
    const exceptionsRes = await request(app)
      .get(`/api/v1/allocations/batches/${activeBatchId}/exceptions?status=PENDING`)
      .set("Authorization", `Bearer ${adminToken}`);

    const pendingExceptions = exceptionsRes.body.data.exceptions;

    // Resolve each pending exception
    for (const ex of pendingExceptions) {
      const resolveRes = await request(app)
        .post(`/api/v1/allocations/exceptions/${ex.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "HOLD",
          justification: "Member record under pastoral review for spiritual qualifications",
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.exception.resolutionStatus).toBe("ON_HOLD");
    }

    // Now with 0 pending exceptions, final approval must succeed!
    const approveRes = await request(app)
      .post("/api/v1/allocations/approve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ batchId: activeBatchId });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.batch.status).toBe("APPROVED");
    expect(approveRes.body.data.batch.approvedBy).toBeDefined();
  });

  it("denies Evaluator from running allocation or approving batches (403 Forbidden)", async () => {
    const runRes = await request(app)
      .post("/api/v1/allocations/run")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({ campusId, cycleName: "Evaluator Attempt" });

    expect(runRes.status).toBe(403);
    expect(runRes.body.error).toBe("Forbidden");

    const approveRes = await request(app)
      .post("/api/v1/allocations/approve")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({ batchId: activeBatchId });

    expect(approveRes.status).toBe(403);
    expect(approveRes.body.error).toBe("Forbidden");
  });
});

