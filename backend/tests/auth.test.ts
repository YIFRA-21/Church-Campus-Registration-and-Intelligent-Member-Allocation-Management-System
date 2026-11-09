import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 1: Authentication & Authorization API Tests", () => {
  it("rejects login with invalid email format (Zod validation)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "invalid-email-format", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Error");
    expect(res.body.details).toBeDefined();
  });

  it("rejects login with wrong password (401 Unauthorized)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("authenticates valid Super Admin credentials and returns signed JWT", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("admin@c-cimas.org");
    expect(res.body.data.user.role).toBe("SUPER_ADMIN");
    expect(res.body.data.user.permissions).toContain("allocation.approve");
  });

  it("protects /api/v1/auth/me against unauthenticated access", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("verifies JWT and returns profile for authenticated user", async () => {
    // 1. Login
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "campusadmin@c-cimas.org", password: "admin123" });

    const token = loginRes.body.data.token;

    // 2. Query /me with token
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.role).toBe("CAMPUS_ADMIN");
    expect(meRes.body.data.user.campusName).toBe("Main Campus (Addis Ababa)");
  });
});

