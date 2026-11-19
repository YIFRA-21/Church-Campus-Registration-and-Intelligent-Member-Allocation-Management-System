import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 3: Member Management Comprehensive Business Rules & API Test Suite", () => {
  let adminToken: string;
  let evaluatorToken: string;
  const validCampusId = "a0000000-0000-0000-0000-000000000001"; // Main Campus

  beforeAll(async () => {
    // 1. Authenticate admin
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Authenticate evaluator
    const evalRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "evaluator@c-cimas.org", password: "admin123" });
    expect(evalRes.status).toBe(200);
    evaluatorToken = evalRes.body.data.token;
  });

  describe("RULE 1: Single Campus Membership Validation", () => {
    it("rejects member registration when campusId is not a valid UUID", async () => {
      const res = await request(app)
        .post("/api/v1/members")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: "invalid-uuid",
          firstName: "Dawit",
          lastName: "Kebede",
          gender: "MALE",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
    });

    it("rejects member registration when campus does not exist in registry", async () => {
      const nonExistentCampus = "a0000000-0000-0000-0000-999999999999";
      const res = await request(app)
        .post("/api/v1/members")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: nonExistentCampus,
          firstName: "Dawit",
          lastName: "Kebede",
          gender: "MALE",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/campus does not exist|Invalid campus/i);
    });
  });

  describe("RULE 2: Automatic Backend-Generated Concurrency-Safe Member Code", () => {
    it("automatically generates standard format member code MEM-YYYY-XXXX when code is omitted", async () => {
      const currentYear = new Date().getFullYear();
      const res = await request(app)
        .post("/api/v1/members")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: validCampusId,
          firstName: "Kaleb",
          lastName: "Haile",
          christianName: "ወልደ ጊዮርጊስ",
          gender: "MALE",
          phoneNumber: "+251911445566",
          academicDepartment: "Electrical Engineering",
          originRegion: "አማራ",
          zone: "ደቡብ ወሎ",
          woreda: "ደሴ",
          kebele: "04",
          dormBlock: "B-21",
          dormRoom: "302",
          language: "አማርኛ",
          age: 22,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const member = res.body.data.member;
      expect(member.memberId).toMatch(new RegExp(`^MEM-${currentYear}-\\d{4}$`));
      expect(member.fullName).toBe("Kaleb Haile");
      expect(member.christianName).toBe("ወልደ ጊዮርጊስ");
      expect(member.academicDepartment).toBe("Electrical Engineering");
    });

    it("concurrently generates 5 unique member codes without collisions", async () => {
      const promises = Array.from({ length: 5 }).map((_, i) =>
        request(app)
          .post("/api/v1/members")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            campusId: validCampusId,
            firstName: `Concurrent${i}`,
            lastName: "Tester",
            gender: "FEMALE",
            age: 20 + i,
          })
      );

      const responses = await Promise.all(promises);
      const codes = responses.map((r) => {
        expect(r.status).toBe(201);
        return r.body.data.member.memberId;
      });

      // Verify all 5 generated codes are globally unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(5);
    });
  });

  describe("RULE 6: Member Code Immutability on Ordinary Edits", () => {
    it("strictly rejects attempts to alter a member's generated memberId", async () => {
      // 1. Create member
      const createRes = await request(app)
        .post("/api/v1/members")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: validCampusId,
          firstName: "Hanna",
          lastName: "Girma",
          gender: "FEMALE",
        });

      expect(createRes.status).toBe(201);
      const originalCode = createRes.body.data.member.memberId;
      const memberDbId = createRes.body.data.member.id;

      // 2. Attempt to tamper with memberId
      const updateRes = await request(app)
        .patch(`/api/v1/members/${memberDbId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          memberId: "HACKED-CODE-999",
          firstName: "Hanna Updated",
        });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.error).toBe("Immutable Field");
      expect(updateRes.body.message).toContain("Rule 6");

      // 3. Verify legitimate update without code change succeeds
      const validUpdateRes = await request(app)
        .patch(`/api/v1/members/${memberDbId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          firstName: "Hanna Updated",
          christianName: "ወለተ ጴጥሮስ",
        });

      expect(validUpdateRes.status).toBe(200);
      expect(validUpdateRes.body.data.member.firstName).toBe("Hanna Updated");
      expect(validUpdateRes.body.data.member.memberId).toBe(originalCode); // preserved
    });
  });

  describe("RULE 5 & 9: Member Status Lifecycle & Mandatory History Justification", () => {
    it("transitions member status with mandatory reason and logs to audit history", async () => {
      // 1. Create a member
      const createRes = await request(app)
        .post("/api/v1/members")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: validCampusId,
          firstName: "Yonas",
          lastName: "Tadesse",
          gender: "MALE",
        });
      const memberId = createRes.body.data.member.id;

      // 2. Reject status transition without reason
      const failStatusRes = await request(app)
        .patch(`/api/v1/members/${memberId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "SUSPENDED",
          reason: "tiny", // too short (< 5 chars)
        });
      expect(failStatusRes.status).toBe(400);

      // 3. Perform valid status transition
      const changeStatusRes = await request(app)
        .patch(`/api/v1/members/${memberId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "INACTIVE",
          reason: "Member currently on study abroad program",
        });
      expect(changeStatusRes.status).toBe(200);
      expect(changeStatusRes.body.data.member.status).toBe("INACTIVE");

      // 4. Retrieve member status history timeline
      const historyRes = await request(app)
        .get(`/api/v1/members/${memberId}/history`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.history.length).toBeGreaterThanOrEqual(2); // initial + change
      const latestHistory = historyRes.body.data.history[0];
      expect(latestHistory.newStatus).toBe("INACTIVE");
      expect(latestHistory.reason).toBe("Member currently on study abroad program");
      expect(latestHistory.changedBy).toBeDefined();
    });

    it("soft-archives member and refuses permanent data loss", async () => {
      const createRes = await request(app)
        .post("/api/v1/members")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: validCampusId,
          firstName: "Archive",
          lastName: "Target",
          gender: "FEMALE",
        });
      const memberId = createRes.body.data.member.id;

      // Soft delete endpoint
      const deleteRes = await request(app)
        .delete(`/api/v1/members/${memberId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Member still exists in database with ARCHIVED status
      const getRes = await request(app)
        .get(`/api/v1/members/${memberId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.member.status).toBe("ARCHIVED");
    });
  });

  describe("RULE 3 & 4: Module 4 Import Integration Services", () => {
    it("finds existing member by phone or exact name match", async () => {
      const res = await request(app)
        .post("/api/v1/members/import/find-duplicate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: validCampusId,
          fullName: "Selamawit Tewodros",
          phoneNumber: "+251922334455",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isMatch).toBe(true);
      expect(res.body.data.member).toBeDefined();
      expect(res.body.data.member.fullName).toBe("Selamawit Tewodros");
    });

    it("creates approved imported member with new auto-generated member code", async () => {
      const res = await request(app)
        .post("/api/v1/members/import/approved-create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: validCampusId,
          fullName: "Samuel Worku",
          gender: "MALE",
          phoneNumber: "+251988112233",
          sourceDepartmentName: "Civil Engineering",
          region: "ኦሮሚያ",
        });

      expect(res.status).toBe(201);
      const member = res.body.data.member;
      expect(member.memberId).toMatch(/^MEM-\d{4}-\d{3,4}$/);
      expect(member.fullName).toBe("Samuel Worku");
      expect(member.academicDepartment).toBe("Civil Engineering");
    });

    it("updates approved imported member while strictly preserving original member code", async () => {
      // 1. Target existing member MEM-2026-002
      const targetId = "10000000-0000-0000-0000-000000000002";
      const res = await request(app)
        .put(`/api/v1/members/import/approved-update/${targetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          campusId: validCampusId,
          fullName: "Selamawit Tewodros Updated",
          gender: "FEMALE",
          sourceDepartmentName: "Accounting & Finance",
          woreda: "Woreda 05",
        });

      expect(res.status).toBe(200);
      const member = res.body.data.member;
      expect(member.memberId).toBe("MEM-2026-002"); // Original member code preserved!
      expect(member.fullName).toBe("Selamawit Tewodros Updated");
      expect(member.woreda).toBe("Woreda 05");
    });
  });

  describe("Real Dashboard Summary Analytics API", () => {
    it("returns real calculated KPIs, completeness rate, and chart breakdowns", async () => {
      const res = await request(app)
        .get("/api/v1/members/dashboard/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const summary = res.body.data.summary;
      expect(summary.totalMembers).toBeGreaterThan(0);
      expect(summary.activeMembers).toBeGreaterThanOrEqual(0);
      expect(summary.inactiveMembers).toBeGreaterThanOrEqual(0);
      expect(summary.archivedMembers).toBeGreaterThanOrEqual(0);
      expect(summary.completenessRate).toBeGreaterThanOrEqual(0);
      expect(summary.completenessRate).toBeLessThanOrEqual(100);
      expect(Array.isArray(summary.campusDistribution)).toBe(true);
      expect(Array.isArray(summary.statusBreakdown)).toBe(true);
      expect(Array.isArray(summary.genderDistribution)).toBe(true);
      expect(Array.isArray(summary.ageBrackets)).toBe(true);
    });
  });
});
