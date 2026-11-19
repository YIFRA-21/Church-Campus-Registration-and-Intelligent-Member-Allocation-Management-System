import { describe, it, expect } from "vitest";
import request from "supertest";
import ExcelJS from "exceljs";
import { app } from "../src/app";

describe("Module 4 & 5: Member Management & Excel Import Pipeline API Tests", () => {
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
  });

  it("lists members with server-side pagination and filters", async () => {
    const res = await request(app)
      .get("/api/v1/members?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.members.length).toBeLessThanOrEqual(5);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pagination.page).toBe(1);
  });

  it("registers an individual member and enforces unique Member ID", async () => {
    // 1. Create member
    const uniqueId = `MEM-TEST-${Date.now()}`;
    const createRes = await request(app)
      .post("/api/v1/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        memberId: uniqueId,
        firstName: "Abel",
        lastName: "Tesfaye",
        gender: "MALE",
        phoneNumber: "+251911889900",
        category: "YOUTH",
        spiritualStatus: "SERVANT",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.member.memberId).toBe(uniqueId);
    expect(createRes.body.data.member.fullName).toBe("Abel Tesfaye");

    // 2. Reject duplicate member ID
    const dupRes = await request(app)
      .post("/api/v1/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        memberId: uniqueId, // Duplicate!
        firstName: "Another",
        lastName: "Person",
        gender: "MALE",
      });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.message).toContain("already exists");
  });

  it("automatically generates an atomic unique member code when memberId is omitted", async () => {
    const autoRes = await request(app)
      .post("/api/v1/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        firstName: "Bethel",
        lastName: "Alemayehu",
        gender: "FEMALE",
        category: "YOUTH",
        spiritualStatus: "REGULAR",
      });

    expect(autoRes.status).toBe(201);
    expect(autoRes.body.data.member.memberId).toMatch(/^MEM-\d{4}-\d{4}$/);
    expect(autoRes.body.data.member.fullName).toBe("Bethel Alemayehu");
  });

  it("downloads the official Excel import template (.xlsx)", async () => {
    const res = await request(app)
      .get("/api/v1/imports/template")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toContain("spreadsheetml.sheet");
    expect(res.header["content-disposition"]).toContain("C-CIMAS-Member-Import-Template.xlsx");
    expect(res.body).toBeDefined();
  });

  it("processes bulk Excel upload: validates required fields, catches duplicates, and reports summary", async () => {
    // Generate an Excel file programmatically
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Members");
    sheet.columns = [
      { header: "Member ID", key: "memberId" },
      { header: "First Name", key: "firstName" },
      { header: "Last Name", key: "lastName" },
      { header: "Gender", key: "gender" },
      { header: "Phone Number", key: "phoneNumber" },
      { header: "Email Address", key: "email" },
      { header: "Category", key: "category" },
      { header: "Spiritual Status", key: "spiritualStatus" },
    ];

    const timestamp = Date.now();
    // Valid row 1
    sheet.addRow({
      memberId: `BATCH-${timestamp}-01`,
      firstName: "Berhanu",
      lastName: "Nega",
      gender: "MALE",
      phoneNumber: "+251911445566",
      category: "ADULT",
      spiritualStatus: "REGULAR",
    });

    // Valid row 2
    sheet.addRow({
      memberId: `BATCH-${timestamp}-02`,
      firstName: "Genet",
      lastName: "Zewde",
      gender: "FEMALE",
      phoneNumber: "+251922556677",
      category: "YOUTH",
      spiritualStatus: "SERVANT",
    });

    // Invalid row 3: Missing Last Name
    sheet.addRow({
      memberId: `BATCH-${timestamp}-03`,
      firstName: "Incomplete",
      lastName: "", // Missing!
      gender: "MALE",
    });

    // Duplicate row 4: Same ID as row 1
    sheet.addRow({
      memberId: `BATCH-${timestamp}-01`, // Duplicate in file!
      firstName: "Berhanu",
      lastName: "Nega Duplicate",
      gender: "MALE",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileBase64 = Buffer.from(buffer).toString("base64");

    const uploadRes = await request(app)
      .post("/api/v1/imports/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        fileName: "batch_test_upload.xlsx",
        fileBase64,
      });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);

    const summary = uploadRes.body.data;
    expect(summary.totalRows).toBe(4);
    expect(summary.validRows).toBe(2);
    expect(summary.invalidRows).toBe(1);
    expect(summary.duplicateRows).toBe(1);
    expect(summary.importedRows).toBe(2);
    expect(summary.failedRows).toBe(2);
    expect(summary.errors.length).toBeGreaterThanOrEqual(2);

    // Verify error report export
    const errorReportRes = await request(app)
      .get(`/api/v1/imports/batches/${summary.batchId}/errors`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(errorReportRes.status).toBe(200);
    expect(errorReportRes.header["content-type"]).toContain("spreadsheetml.sheet");
  });

  it("denies Evaluator from uploading Excel files (403 Forbidden)", async () => {
    const res = await request(app)
      .post("/api/v1/imports/upload")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        fileName: "test.xlsx",
        fileBase64: "dGVzdA==",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });
});

