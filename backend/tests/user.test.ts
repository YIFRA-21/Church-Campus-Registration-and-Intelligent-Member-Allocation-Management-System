import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 2: User and Role Management API Tests", () => {
  let superAdminToken: string;
  let campusAdminToken: string;
  let regOfficerToken: string;

  it("authenticates roles for user management tests", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    superAdminToken = adminRes.body.data.token;

    const campusRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "campusadmin@c-cimas.org", password: "admin123" });
    campusAdminToken = campusRes.body.data.token;

    const officerRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "regofficer@c-cimas.org", password: "admin123" });
    regOfficerToken = officerRes.body.data.token;
  });

  it("returns role catalog listing all 6 primary roles", async () => {
    const res = await request(app)
      .get("/api/v1/users/roles")
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.roles.length).toBe(6);
    const roleNames = res.body.data.roles.map((r: { name: string }) => r.name);
    expect(roleNames).toContain("SUPER_ADMIN");
    expect(roleNames).toContain("CAMPUS_ADMIN");
    expect(roleNames).toContain("REGISTRATION_OFFICER");
    expect(roleNames).toContain("DEPT_MANAGER");
    expect(roleNames).toContain("EVALUATOR");
    expect(roleNames).toContain("VIEWER_AUDITOR");
  });

  it("denies access to Registration Officer without user.manage permission (403)", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${regOfficerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("allows Campus Admin to create a registration officer within their campus", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        email: "newofficer@c-cimas.org",
        password: "securePassword123",
        fullName: "Abebe Lemma",
        role: "REGISTRATION_OFFICER",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("newofficer@c-cimas.org");
    expect(res.body.data.user.role).toBe("REGISTRATION_OFFICER");
  });

  it("prevents Campus Admin from creating a Super Admin account (403)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        email: "escalation@c-cimas.org",
        password: "securePassword123",
        fullName: "Privilege Escalation Attempt",
        role: "SUPER_ADMIN",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Only Super Administrators");
  });
});
