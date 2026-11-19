import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { calculateLargestRemainderTargets } from "../src/utils/rounding";

describe("Module 2: Department Management & Percentage Targets Full Architecture Tests", () => {
  let adminToken: string;
  let evaluatorToken: string;

  it("authenticates admin and evaluator accounts", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    adminToken = adminRes.body.data.token;

    const evalRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "evaluator@c-cimas.org", password: "admin123" });
    evaluatorToken = evalRes.body.data.token;

    expect(adminToken).toBeDefined();
    expect(evaluatorToken).toBeDefined();
  });

  it("retrieves executive dashboard summary KPI metrics", async () => {
    const res = await request(app)
      .get("/api/v1/departments/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const summary = res.body.data.summary;
    expect(summary.totalDepartments).toBeGreaterThanOrEqual(5);
    expect(summary.activeDepartments).toBeGreaterThanOrEqual(5);
    expect(summary.totalCapacity).toBeGreaterThan(0);
    expect(summary.isTargetSumValid).toBe(true);
    expect(summary.currentTargetSum).toBe(100);
  });

  it("lists all default departments with target percentages, capacity, and status", async () => {
    const res = await request(app)
      .get("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.departments.length).toBeGreaterThanOrEqual(5);

    const codes = res.body.data.departments.map((d: { code: string }) => d.code);
    expect(codes).toContain("CHOIR-01");
    expect(codes).toContain("TEACH-01");
    expect(codes).toContain("PRAY-01");
  });

  it("enforces globally unique department code constraint (case-insensitive)", async () => {
    const res = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        code: "choir-01", // Duplicate code in lowercase
        name: "Second Choir Department",
        capacity: 200,
        targetPercentage: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Request Failed");
    expect(res.body.message).toContain("already exists in the system");
  });

  it("denies Evaluator from creating or modifying departments (403 Forbidden)", async () => {
    const res = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        code: "TEST-99",
        name: "Test Dept",
        capacity: 100,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("transitions department lifecycle status with required reason and history record", async () => {
    const deptsRes = await request(app)
      .get("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`);
    const deptId = deptsRes.body.data.departments[0].id;

    const statusRes = await request(app)
      .patch(`/api/v1/departments/${deptId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "INACTIVE",
        reason: "Temporary seasonal liturgical recess for restructuring",
      });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.department.status).toBe("INACTIVE");
    expect(statusRes.body.data.department.isActive).toBe(false);

    // Verify history recorded
    const getRes = await request(app)
      .get(`/api/v1/departments/${deptId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(getRes.body.data.department.statusHistory.length).toBeGreaterThanOrEqual(1);
    expect(getRes.body.data.department.statusHistory[0].reason).toContain("Temporary seasonal liturgical recess");

    // Restore to ACTIVE
    await request(app)
      .patch(`/api/v1/departments/${deptId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "ACTIVE",
        reason: "Liturgical season reopened",
      });
  });

  it("handles capacity reduction below allocated members with required confirmation", async () => {
    const deptsRes = await request(app)
      .get("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`);
    const dept = deptsRes.body.data.departments.find(
      (d: { allocatedMembersCount: number }) => d.allocatedMembersCount > 0
    );
    expect(dept).toBeDefined();

    // Try reducing capacity below allocated count WITHOUT confirmation
    const reduceRes = await request(app)
      .patch(`/api/v1/departments/${dept.id}/capacity`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        capacity: 1, // Lower than allocatedMembersCount (e.g. 4)
        confirmation: false,
      });

    expect(reduceRes.status).toBe(200);
    expect(reduceRes.body.requiresConfirmation).toBe(true);
    expect(reduceRes.body.shortfall).toBeGreaterThan(0);

    // Now reduce WITH explicit confirmation
    const confirmRes = await request(app)
      .patch(`/api/v1/departments/${dept.id}/capacity`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        capacity: 1,
        confirmation: true,
        reason: "Hall renovations reducing seating",
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.department.capacity).toBe(1);
    expect(confirmRes.body.data.department.overCapacity).toBe(true);

    // Restore capacity
    await request(app)
      .patch(`/api/v1/departments/${dept.id}/capacity`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        capacity: 600,
        confirmation: true,
        reason: "Renovations completed",
      });
  });

  it("validates percentage targets and rejects non-100% distribution", async () => {
    const deptsRes = await request(app)
      .get("/api/v1/departments?campusId=a0000000-0000-0000-0000-000000000001")
      .set("Authorization", `Bearer ${adminToken}`);

    const depts = deptsRes.body.data.departments.slice(0, 5);

    // Sum is 90%
    const invalidTargets = [
      { departmentId: depts[0].id, percentage: 30 },
      { departmentId: depts[1].id, percentage: 25 },
      { departmentId: depts[2].id, percentage: 20 },
      { departmentId: depts[3].id, percentage: 15 },
    ];

    const valRes = await request(app)
      .post("/api/v1/departments/targets/validate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        targets: invalidTargets,
      });

    expect(valRes.status).toBe(200);
    expect(valRes.body.data.isValid).toBe(false);
    expect(valRes.body.data.sum).toBe(90);
    expect(valRes.body.data.difference).toBe(10);
  });

  it("finalizes valid percentage targets with immutable snapshot versioning", async () => {
    const deptsRes = await request(app)
      .get("/api/v1/departments?campusId=a0000000-0000-0000-0000-000000000001")
      .set("Authorization", `Bearer ${adminToken}`);

    const depts = deptsRes.body.data.departments.slice(0, 5);

    const validTargets = [
      { departmentId: depts[0].id, percentage: 30.0 },
      { departmentId: depts[1].id, percentage: 25.0 },
      { departmentId: depts[2].id, percentage: 20.0 },
      { departmentId: depts[3].id, percentage: 15.0 },
      { departmentId: depts[4].id, percentage: 10.0 },
    ];

    const res = await request(app)
      .post("/api/v1/departments/targets/finalize")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        cycleName: "2026/2027 Official Versioned Allocation Cycle",
        targets: validTargets,
        confirmShortfalls: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.configuration.isActive).toBe(true);
    expect(res.body.data.configuration.version).toBeGreaterThanOrEqual(1);

    // Verify history returns version snapshot
    const histRes = await request(app)
      .get("/api/v1/departments/targets/history?campusId=a0000000-0000-0000-0000-000000000001")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(histRes.status).toBe(200);
    expect(histRes.body.data.history.length).toBeGreaterThanOrEqual(1);
  });

  it("configures and retrieves department eligibility rules (Modules 2 & 5)", async () => {
    const deptsRes = await request(app)
      .get("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`);
    const deptId = deptsRes.body.data.departments[0].id;

    const rulesPayload = [
      {
        ruleName: "Minimum Sunday School Formation",
        ruleType: "SUNDAY_SCHOOL_YEARS",
        operator: "GREATER_THAN_OR_EQUAL",
        value: 2,
        isMandatory: true,
        isActive: true,
      },
      {
        ruleName: "Christian Baptism Required",
        ruleType: "BAPTISM_STATUS",
        operator: "EQUALS",
        value: true,
        isMandatory: true,
        isActive: true,
      },
    ];

    const putRes = await request(app)
      .put(`/api/v1/departments/${deptId}/eligibility-rules`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rules: rulesPayload });

    expect(putRes.status).toBe(200);
    expect(putRes.body.data.rules.length).toBe(2);

    const getRes = await request(app)
      .get(`/api/v1/departments/${deptId}/eligibility-rules`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.rules.length).toBe(2);
    expect(getRes.body.data.rules[0].ruleName).toBe("Minimum Sunday School Formation");
  });

  it("verifies Largest Remainder Method with the Master Prompt example (1,000 members)", async () => {
    const simulationRes = await request(app)
      .post("/api/v1/departments/targets/simulate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        totalMembers: 1000,
      });

    expect(simulationRes.status).toBe(200);
    expect(simulationRes.body.data.totalAllocatedTarget).toBe(1000);

    const targets = simulationRes.body.data.targets;
    const choir = targets.find((t: { departmentCode: string }) => t.departmentCode === "CHOIR-01");
    const teaching = targets.find((t: { departmentCode: string }) => t.departmentCode === "TEACH-01");
    const prayer = targets.find((t: { departmentCode: string }) => t.departmentCode === "PRAY-01");
    const evangelism = targets.find((t: { departmentCode: string }) => t.departmentCode === "EVANG-01");
    const social = targets.find((t: { departmentCode: string }) => t.departmentCode === "SOC-01");

    expect(choir.targetCount).toBe(300); // 30% of 1000
    expect(teaching.targetCount).toBe(250); // 25% of 1000
    expect(prayer.targetCount).toBe(200); // 20% of 1000
    expect(evangelism.targetCount).toBe(150); // 15% of 1000
    expect(social.targetCount).toBe(100); // 10% of 1000
  });

  it("verifies Largest Remainder Method with non-even population (1,003 members: exact sum 1,003)", () => {
    const sampleDepts = [
      { departmentId: "1", departmentCode: "CHOIR", departmentName: "Choir", percentage: 30.0 },
      { departmentId: "2", departmentCode: "TEACH", departmentName: "Teaching", percentage: 25.0 },
      { departmentId: "3", departmentCode: "PRAY", departmentName: "Prayer", percentage: 20.0 },
      { departmentId: "4", departmentCode: "EVANG", departmentName: "Evangelism", percentage: 15.0 },
      { departmentId: "5", departmentCode: "SOC", departmentName: "Social", percentage: 10.0 },
    ];

    const result = calculateLargestRemainderTargets(1003, sampleDepts);

    expect(result.totalAllocatedTarget).toBe(1003);
    const sum = result.targets.reduce((acc, t) => acc + t.targetCount, 0);
    expect(sum).toBe(1003);
  });

  it("retrieves department roster with pagination and capacity stats", async () => {
    const deptsRes = await request(app)
      .get("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`);

    const deptId = deptsRes.body.data.departments[0].id;

    const rosterRes = await request(app)
      .get(`/api/v1/departments/${deptId}/roster?page=1&limit=10`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(rosterRes.status).toBe(200);
    expect(rosterRes.body.success).toBe(true);
    expect(rosterRes.body.data.department).toBeDefined();
    expect(rosterRes.body.data.department.id).toBe(deptId);
    expect(Array.isArray(rosterRes.body.data.members)).toBe(true);
    expect(rosterRes.body.data.pagination).toBeDefined();
  });

  it("exports department roster as an Excel binary spreadsheet", async () => {
    const deptsRes = await request(app)
      .get("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`);

    const deptId = deptsRes.body.data.departments[0].id;

    const exportRes = await request(app)
      .get(`/api/v1/departments/${deptId}/export`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(exportRes.body).toBeDefined();
  });
});
