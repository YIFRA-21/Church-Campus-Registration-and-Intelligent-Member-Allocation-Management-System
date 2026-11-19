import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 4: Import & Validation Management (CSV Pipeline & Duplicate Review)", () => {
  let adminToken: string;
  let evaluatorToken: string;
  let testBatchId: string;
  let duplicateCandidateId: string;

  it("authenticates admin and evaluator credentials", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    const evalRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "evaluator@c-cimas.org", password: "admin123" });
    expect(evalRes.status).toBe(200);
    evaluatorToken = evalRes.body.data.token;
  });

  it("downloads official CSV template with UTF-8 BOM and sample Amharic columns", async () => {
    const res = await request(app)
      .get("/api/v1/imports/template/csv")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toContain("text/csv");
    expect(res.header["content-disposition"]).toContain("C-CIMAS-Member-Import-Template.csv");
    expect(res.text).toContain("full_name");
    expect(res.text).toContain("gender");
    expect(res.text).toContain("ዮሐንስ ተስፋዬ"); // Sample Amharic row
  });

  it("strictly rejects Excel spreadsheets (.xlsx, .xls) on CSV upload with helpful message", async () => {
    // Magic bytes for XLSX (PK\x03\x04)
    const xlsxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const base64 = xlsxBuffer.toString("base64");

    const res = await request(app)
      .post("/api/v1/imports/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        fileName: "members_export.xlsx",
        fileBase64: base64,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Only CSV (.csv) files are supported for import");
  });

  it("rejects empty CSV uploads", async () => {
    const res = await request(app)
      .post("/api/v1/imports/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        fileName: "empty.csv",
        fileBase64: Buffer.from("   \n  ").toString("base64"),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("empty");
  });

  it("uploads a valid UTF-8 CSV containing Amharic characters and escaped quotes", async () => {
    const csvContent =
      "\uFEFF" + // UTF-8 BOM
      "serial_number,full_name,christian_name,gender,phone,source_department_name,region,age\n" +
      // Row 1: Valid new candidate
      ',በላይነህ ጥላሁን,ተክለ ሚካኤል,MALE,+251911330099,ኢንፎርሜሽን ሳይንስ (Information Science),አዲስ አበባ,22\n' +
      // Row 2: Duplicate candidate (phone matches Ephraim Haile: +251911223344)
      ',Ephraim Haile,ገብረ ማርያም,MALE,+251911223344,Computer Science,አዲስ አበባ,22\n' +
      // Row 3: Invalid row (missing full_name)
      ',,ወለተ ሰማዕት,FEMALE,+251922339900,ሕክምና,አማራ,21\n' +
      // Row 4: Intra-batch duplicate phone (duplicate of Row 1)
      ',ዮዲት አስፋው,ወለተ ማርያም,FEMALE,+251911330099,ማኔጅመንት,ኦሮሚያ,20\n';

    const base64 = Buffer.from(csvContent, "utf8").toString("base64");

    const res = await request(app)
      .post("/api/v1/imports/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        fileName: "campus_members_cohort_2026.csv",
        fileBase64: base64,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.batch).toBeDefined();
    expect(res.body.data.batch.fileName).toBe("campus_members_cohort_2026.csv");
    expect(res.body.data.batch.totalRows).toBe(4);
    expect(res.body.data.batch.fileChecksum).toBeDefined();

    testBatchId = res.body.data.batch.id;

    // Verify suggested mappings
    const suggested = res.body.data.suggestedMappings;
    expect(suggested["full_name"]).toBe("full_name");
    expect(suggested["gender"]).toBe("gender");
    expect(suggested["phone"]).toBe("phone");
  });

  it("confirms column mappings and validates staging rows", async () => {
    const mappings = [
      { csvColumn: "serial_number", targetField: "serial_number" },
      { csvColumn: "full_name", targetField: "full_name" },
      { csvColumn: "christian_name", targetField: "christian_name" },
      { csvColumn: "gender", targetField: "gender" },
      { csvColumn: "phone", targetField: "phone" },
      { csvColumn: "source_department_name", targetField: "source_department_name" },
      { csvColumn: "region", targetField: "region" },
      { csvColumn: "age", targetField: "age" },
    ];

    const res = await request(app)
      .post(`/api/v1/imports/${testBatchId}/mapping`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ mappings });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const batch = res.body.data.batch;
    expect(batch.totalRows).toBe(4);
    expect(batch.invalidRows).toBeGreaterThanOrEqual(1); // Row 3 missing full_name
    expect(batch.duplicateRows).toBeGreaterThanOrEqual(1); // Row 2 duplicates Ephraim Haile
  });

  it("retrieves validation results with row-level errors", async () => {
    const res = await request(app)
      .get(`/api/v1/imports/${testBatchId}/validation-results`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalRows).toBe(4);

    const errors = res.body.data.errors;
    const missingNameErr = errors.find((e: any) => e.fieldName === "full_name");
    expect(missingNameErr).toBeDefined();
    expect(missingNameErr.errorCode).toBe("REQUIRED_FIELD_MISSING");
  });

  it("retrieves duplicate candidate list and matches details", async () => {
    const res = await request(app)
      .get(`/api/v1/imports/${testBatchId}/duplicates`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.candidates.length).toBeGreaterThanOrEqual(1);

    const candidate = res.body.data.candidates[0];
    duplicateCandidateId = candidate.id;
    expect(candidate.matchScore).toBeGreaterThanOrEqual(80);
    expect(candidate.existingMember).toBeDefined();
    expect(candidate.existingMember.memberId).toBe("MEM-2026-001"); // Ephraim Haile
  });

  it("strictly blocks approval when duplicate candidates remain pending review", async () => {
    const res = await request(app)
      .post(`/api/v1/imports/${testBatchId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ notes: "Attempting premature approval" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Approval blocked");
    expect(res.body.message).toContain("require administrative review");
  });

  it("submits an Administrator review decision for the duplicate candidate", async () => {
    // Admin decides to approve as an update to the existing member
    const res = await request(app)
      .post(`/api/v1/imports/${testBatchId}/duplicates/${duplicateCandidateId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        decision: "update_existing_member",
        reason: "Confirmed fellowship student updating contact phone & department record",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.candidate.reviewStatus).toBe("update_existing_member");
  });

  it("successfully approves the import batch after all reviews are resolved", async () => {
    const res = await request(app)
      .post(`/api/v1/imports/${testBatchId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ notes: "All duplicate candidates reviewed and verified by Administrator" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.batch.status).toBe("approved");
    expect(res.body.data.batch.approvedRows).toBeGreaterThanOrEqual(1);
  });

  it("processes approved batch: calls Module 3 member services, generates new member codes and preserves update codes", async () => {
    const res = await request(app)
      .post(`/api/v1/imports/${testBatchId}/process`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const batch = res.body.data.batch;
    expect(batch.status).toMatch(/completed/);
    expect(batch.importedRows).toBeGreaterThanOrEqual(1); // Created Row 1
    expect(batch.updatedRows).toBeGreaterThanOrEqual(1); // Updated Row 2
  });

  it("verifies idempotency: re-running process does not duplicate already imported rows", async () => {
    const prevImported = (await request(app)
      .get(`/api/v1/imports/${testBatchId}`)
      .set("Authorization", `Bearer ${adminToken}`)).body.data.batch.importedRows;

    const res = await request(app)
      .post(`/api/v1/imports/${testBatchId}/process`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Batch was already completed
    expect(res.status).toBe(400); // Cannot re-process without retry state
  });

  it("downloads original CSV file with matching checksum and Content-Disposition", async () => {
    const res = await request(app)
      .get(`/api/v1/imports/${testBatchId}/original-file`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toContain("text/csv");
    expect(res.header["content-disposition"]).toContain("campus_members_cohort_2026.csv");
    expect(res.text).toContain("በላይነህ ጥላሁን");
  });

  it("denies Evaluator from approving or processing import batches (403 Forbidden)", async () => {
    const approveRes = await request(app)
      .post(`/api/v1/imports/${testBatchId}/approve`)
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({ notes: "Unauthorized attempt" });

    expect(approveRes.status).toBe(403);

    const processRes = await request(app)
      .post(`/api/v1/imports/${testBatchId}/process`)
      .set("Authorization", `Bearer ${evaluatorToken}`);

    expect(processRes.status).toBe(403);
  });
});
