import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Modules 12 & 13: Reports, Analytics & Audit History API Tests", () => {
  let adminToken: string;
  let evaluatorToken: string;

  it("authenticates admin and evaluator credentials", async () => {
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

  it("retrieves dashboard analytics with member counts, target rates, and demographics", async () => {
    const res = await request(app)
      .get("/api/v1/reports/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campusesCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.departmentsCount).toBeGreaterThanOrEqual(5);
    expect(res.body.data.totalMembers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.demographics).toBeDefined();
    expect(res.body.data.demographics.gender).toBeDefined();
    expect(res.body.data.departmentStats).toBeDefined();
  });

  it("retrieves department percentage allocation distribution report", async () => {
    const res = await request(app)
      .get("/api/v1/reports/department-distribution?campusId=a0000000-0000-0000-0000-000000000001")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campus).toBeDefined();
    expect(Array.isArray(res.body.data.departments)).toBe(true);
    expect(res.body.data.departments.length).toBeGreaterThanOrEqual(5);
  });

  it("retrieves evaluator performance report", async () => {
    const res = await request(app)
      .get("/api/v1/reports/evaluator-performance")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.evaluators)).toBe(true);
  });

  it("exports official Excel report spreadsheet", async () => {
    const res = await request(app)
      .get("/api/v1/reports/export?type=department_distribution&campusId=a0000000-0000-0000-0000-000000000001")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(res.body).toBeDefined();
  });

  it("retrieves immutable audit logs for Admin", async () => {
    const res = await request(app)
      .get("/api/v1/reports/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
    expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.logs[0].actorRole).toBe("ADMIN");
  });

  it("denies Evaluator from viewing audit logs (403 Forbidden)", async () => {
    const res = await request(app)
      .get("/api/v1/reports/audit-logs")
      .set("Authorization", `Bearer ${evaluatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });
});

