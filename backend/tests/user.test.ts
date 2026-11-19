import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 1/4: User and Evaluator Account Management Tests (2 Official Roles)", () => {
  let adminToken: string;
  let evaluatorToken: string;

  it("authenticates roles for user management tests", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    adminToken = adminRes.body.data.token;

    const evalRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "evaluator@c-cimas.org", password: "admin123" });
    evaluatorToken = evalRes.body.data.token;
  });

  it("returns role catalog listing strictly TWO official roles (ADMIN and EVALUATOR)", async () => {
    const res = await request(app)
      .get("/api/v1/users/roles")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.roles.length).toBe(2);
    const roleNames = res.body.data.roles.map((r: { name: string }) => r.name);
    expect(roleNames).toEqual(expect.arrayContaining(["ADMIN", "EVALUATOR"]));
    expect(roleNames).not.toContain("SUPER_ADMIN");
    expect(roleNames).not.toContain("DEPT_MANAGER");
  });

  it("denies access to Evaluator without user.manage permission (403)", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${evaluatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("allows Admin to create a new Evaluator account", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "newevaluator@c-cimas.org",
        password: "securePassword123",
        fullName: "Deacon Yohannes Wolde",
        role: "EVALUATOR",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("newevaluator@c-cimas.org");
    expect(res.body.data.user.role).toBe("EVALUATOR");
  });

  it("rejects creating user with invalid role outside ADMIN or EVALUATOR", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "invalidrole@c-cimas.org",
        password: "securePassword123",
        fullName: "Test Person",
        role: "MANAGER", // Disallowed role
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Error");
  });
});
