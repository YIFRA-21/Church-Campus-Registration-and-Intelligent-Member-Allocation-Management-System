import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 1: Campus Management Comprehensive API Suite", () => {
  let adminToken: string;
  let evaluatorToken: string;
  let createdCampusId: string;

  it("authenticates official test accounts (Admin & Evaluator)", async () => {
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

  it("allows Admin to retrieve executive campus dashboard summary", async () => {
    const res = await request(app)
      .get("/api/v1/campuses/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalCampuses).toBeGreaterThanOrEqual(2);
    expect(res.body.data.summary.activeCampuses).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data.summary.recentCampuses)).toBe(true);
    expect(Array.isArray(res.body.data.summary.recentStatusChanges)).toBe(true);
  });

  it("allows Admin to view all campuses with pagination & searching", async () => {
    const res = await request(app)
      .get("/api/v1/campuses?page=1&limit=10&search=Addis")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.campuses)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
  });

  it("prevents Evaluator from creating a new campus (403 Forbidden)", async () => {
    const res = await request(app)
      .post("/api/v1/campuses")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({
        code: "HAW-03",
        name: "Hawassa Campus",
        city: "Hawassa",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("allows Admin to create a valid new campus with primary contact and initial history", async () => {
    const res = await request(app)
      .post("/api/v1/campuses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "BAH-03",
        name: "Bahir Dar Campus",
        description: "Lake Tana Regional Student Center",
        region: "Amhara",
        city: "Bahir Dar",
        address: "St. George Cathedral Compound",
        phoneNumber: "+251582201122",
        email: "bahirdar@c-cimas.org",
        status: "ACTIVE",
        primaryContactName: "Ato Daniel Assefa",
        primaryContactPhone: "+251918334455",
        primaryContactPosition: "Regional Director",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campus.code).toBe("BAH-03");
    expect(res.body.data.campus.city).toBe("Bahir Dar");
    expect(res.body.data.campus.status).toBe("ACTIVE");
    expect(res.body.data.campus.contacts.length).toBe(1);
    expect(res.body.data.campus.contacts[0].isPrimary).toBe(true);
    expect(res.body.data.campus.statusHistory.length).toBe(1);

    createdCampusId = res.body.data.campus.id;
  });

  it("rejects creating a campus with duplicate code (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/v1/campuses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "BAH-03", // duplicate code
        name: "Duplicate Bahir Dar",
        city: "Bahir Dar",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Request Failed");
    expect(res.body.message).toContain("already exists");
  });

  it("allows retrieving specific campus details by ID with contacts and status history", async () => {
    const res = await request(app)
      .get(`/api/v1/campuses/${createdCampusId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campus.id).toBe(createdCampusId);
    expect(res.body.data.campus.contacts).toBeDefined();
    expect(res.body.data.campus.statusHistory).toBeDefined();
  });

  it("allows updating campus details (PATCH /:id)", async () => {
    const res = await request(app)
      .patch(`/api/v1/campuses/${createdCampusId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        address: "Updated St. George Diocesan Compound",
        description: "Updated description for Lake Tana regional center",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campus.address).toBe("Updated St. George Diocesan Compound");
  });

  it("requires a meaningful reason when changing campus operational status", async () => {
    const res = await request(app)
      .patch(`/api/v1/campuses/${createdCampusId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "INACTIVE",
        reason: "No", // too short, < 5 chars
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation Error");
  });

  it("successfully transitions campus status to INACTIVE with documented reason and logs history", async () => {
    const res = await request(app)
      .patch(`/api/v1/campuses/${createdCampusId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "INACTIVE",
        reason: "Scheduled facility maintenance and academic summer recess",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campus.status).toBe("INACTIVE");
    expect(res.body.data.campus.isActive).toBe(false);

    // Verify history audit timeline
    const historyRes = await request(app)
      .get(`/api/v1/campuses/${createdCampusId}/history`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.history.length).toBeGreaterThanOrEqual(2);
    expect(historyRes.body.data.history[0].newStatus).toBe("INACTIVE");
    expect(historyRes.body.data.history[0].reason).toContain("facility maintenance");
  });

  it("manages campus contact directory and enforces at most 1 primary contact", async () => {
    // Attempt with 2 primary contacts
    const failRes = await request(app)
      .put(`/api/v1/campuses/${createdCampusId}/contacts`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        contacts: [
          { contactName: "Contact One", position: "Lead", phone: "+251911001122", isPrimary: true },
          { contactName: "Contact Two", position: "Vice Lead", phone: "+251911003344", isPrimary: true },
        ],
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.message).toContain("cannot have more than one primary contact");

    // Valid update with exactly 1 primary contact
    const successRes = await request(app)
      .put(`/api/v1/campuses/${createdCampusId}/contacts`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        contacts: [
          { contactName: "Ato Daniel Assefa", position: "Regional Director", phone: "+251918334455", isPrimary: true },
          { contactName: "W/ro Tigist Hailu", position: "Campus Secretary", phone: "+251911556677", isPrimary: false },
        ],
      });

    expect(successRes.status).toBe(200);
    expect(successRes.body.data.contacts.length).toBe(2);
    expect(successRes.body.data.contacts[0].isPrimary).toBe(true);
    expect(successRes.body.data.contacts[1].isPrimary).toBe(false);
  });
});
