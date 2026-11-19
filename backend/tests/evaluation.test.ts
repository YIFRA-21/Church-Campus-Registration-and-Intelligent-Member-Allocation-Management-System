import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Module 11: Evaluation Management API Tests", () => {
  let adminToken: string;
  let evaluatorToken: string;
  let evaluatorUserId: string;
  let createdTaskId: string;
  let evaluationId: string;

  it("authenticates admin and evaluator credentials", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });
    adminToken = adminRes.body.data.token;

    const evalRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "evaluator@c-cimas.org", password: "admin123" });
    evaluatorToken = evalRes.body.data.token;
    evaluatorUserId = evalRes.body.data.user.id;

    expect(adminToken).toBeDefined();
    expect(evaluatorToken).toBeDefined();
    expect(evaluatorUserId).toBeDefined();
  });

  it("allows Admin to create an evaluation task and assign candidates to Evaluator", async () => {
    const res = await request(app)
      .post("/api/v1/evaluations/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        departmentId: "d0000000-0000-0000-0000-000000000001",
        assignedTo: evaluatorUserId,
        title: "2026 Choir Tenor Audition",
        description: "Assess vocal range, pitch accuracy, and hymn repertoire.",
        candidateMemberIds: [
          "10000000-0000-0000-0000-000000000001",
          "10000000-0000-0000-0000-000000000002",
        ],
        dueDate: "2026-12-15T18:00:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task).toBeDefined();
    expect(res.body.data.task.title).toBe("2026 Choir Tenor Audition");
    expect(res.body.data.task.assignedTo).toBe(evaluatorUserId);
    expect(res.body.data.task.status).toBe("PENDING");

    createdTaskId = res.body.data.task.id;
  });

  it("denies Evaluator from creating evaluation tasks (403 Forbidden)", async () => {
    const res = await request(app)
      .post("/api/v1/evaluations/tasks")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({
        campusId: "a0000000-0000-0000-0000-000000000001",
        departmentId: "d0000000-0000-0000-0000-000000000001",
        assignedTo: evaluatorUserId,
        title: "Unauthorized Task",
        candidateMemberIds: ["10000000-0000-0000-0000-000000000001"],
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("evaluator retrieves assigned evaluation tasks", async () => {
    const res = await request(app)
      .get("/api/v1/evaluations/tasks")
      .set("Authorization", `Bearer ${evaluatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    const task = res.body.data.tasks.find((t: { id: string }) => t.id === createdTaskId);
    expect(task).toBeDefined();
  });

  it("evaluator retrieves task details including candidate members", async () => {
    const res = await request(app)
      .get(`/api/v1/evaluations/tasks/${createdTaskId}`)
      .set("Authorization", `Bearer ${evaluatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task.id).toBe(createdTaskId);
    expect(res.body.data.candidates.length).toBe(2);
    expect(res.body.data.candidates[0].member).toBeDefined();
  });

  it("evaluator saves a draft evaluation", async () => {
    const res = await request(app)
      .post("/api/v1/evaluations/assessments")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({
        taskId: createdTaskId,
        memberId: "10000000-0000-0000-0000-000000000001",
        score: 75,
        comments: "Candidate showed promising potential, still reviewing vocal stability.",
        isDraft: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.evaluation.status).toBe("DRAFT");
    expect(res.body.data.evaluation.score).toBe(75);
  });

  it("evaluator submits final evaluation assessment", async () => {
    const res = await request(app)
      .post("/api/v1/evaluations/assessments")
      .set("Authorization", `Bearer ${evaluatorToken}`)
      .send({
        taskId: createdTaskId,
        memberId: "10000000-0000-0000-0000-000000000001",
        score: 92,
        comments: "Outstanding vocal range, impeccable rhythm, and exemplary devotion.",
        criteriaScores: {
          vocalQuality: 95,
          spiritualReadiness: 90,
          punctuality: 90,
        },
        isDraft: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.evaluation.status).toBe("SUBMITTED");
    expect(res.body.data.evaluation.score).toBe(92);
    expect(res.body.data.evaluation.submittedAt).toBeDefined();

    evaluationId = res.body.data.evaluation.id;
  });

  it("admin requests correction with detailed notes", async () => {
    const res = await request(app)
      .post(`/api/v1/evaluations/assessments/${evaluationId}/correction`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        notes: "Please re-check Saturday choir rehearsal availability before final score.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.evaluation.status).toBe("CORRECTION_REQUESTED");
    expect(res.body.data.evaluation.adminFeedback).toContain("Saturday choir rehearsal");
  });

  it("admin approves final evaluation", async () => {
    const res = await request(app)
      .post(`/api/v1/evaluations/assessments/${evaluationId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        notes: "Approved for tenor section.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.evaluation.status).toBe("APPROVED");
  });
});
