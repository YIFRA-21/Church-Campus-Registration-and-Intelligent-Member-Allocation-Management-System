import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 3: Campus Management API Tests", () => {
  let superAdminToken: string;
  let campusAdminToken: string;

  it("authenticates test accounts", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    superAdminToken = adminRes.body.data.token;

    const campusRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "campusadmin@c-cimas.org", password: "admin123" });
    campusAdminToken = campusRes.body.data.token;

    expect(superAdminToken).toBeDefined();
    expect(campusAdminToken).toBeDefined();
  });

  it("allows Super Admin to view all campuses", async () => {
    const res = await request(app)
      .get("/api/v1/campuses")
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campuses.length).toBeGreaterThanOrEqual(2);
  });

  it("enforces tenant isolation: Campus Admin only views assigned campus", async () => {
    const res = await request(app)
      .get("/api/v1/campuses")
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.campuses.length).toBe(1);
    expect(res.body.data.campuses[0].code).toBe("ADD-01");
  });

  it("prevents Campus Admin from creating a new campus (403 Forbidden)", async () => {
    const res = await request(app)
      .post("/api/v1/campuses")
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        code: "HAW-03",
        name: "Hawassa Campus",
        city: "Hawassa",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("allows Super Admin to create a valid new campus", async () => {
    const res = await request(app)
      .post("/api/v1/campuses")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        code: "HAW-03",
        name: "Hawassa Lakeside Campus",
        city: "Hawassa",
        phoneNumber: "+251462200000",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campus.code).toBe("HAW-03");
  });

  it("rejects duplicate campus code with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/v1/campuses")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        code: "ADD-01",
        name: "Duplicate Addis Campus",
        city: "Addis Ababa",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already exists");
  });
});
