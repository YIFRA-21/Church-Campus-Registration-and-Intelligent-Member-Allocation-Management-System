import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { CampusService } from "../src/services/campus.service";
import { DepartmentService } from "../src/services/department.service";
import { MemberService } from "../src/services/member.service";
import { AllocationService } from "../src/services/allocation.service";

describe("High-Capacity Scalability & Master Integrity Simulation (5,000 Members)", () => {
  let adminToken: string;
  let scaleCampusId: string;
  let choirDeptId: string;
  let teachingDeptId: string;
  let prayerDeptId: string;
  let evangelismDeptId: string;
  let socialDeptId: string;

  it("authenticates system administrator", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@c-cimas.org", password: "admin123" });

    expect(res.status).toBe(200);
    adminToken = res.body.data.token;
  });

  it("sets up high-capacity simulation campus", async () => {
    const res = await request(app)
      .post("/api/v1/campuses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "SCALE-5K",
        name: "5,000 Member Scale Testing Campus",
        region: "Oromia",
        city: "Bishoftu",
      });

    expect(res.status).toBe(201);
    scaleCampusId = res.body.data.campus.id;
  });

  it("creates 5 departments configured with the Master Specification percentage targets", async () => {
    // 1. Choir: 30%
    const cRes = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: scaleCampusId,
        code: "CHOIR-5K",
        name: "Scale Choir Department",
        capacity: 2000,
        targetPercentage: 30.0,
      });
    choirDeptId = cRes.body.data.department.id;

    // 2. Teaching: 25%
    const tRes = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: scaleCampusId,
        code: "TEACH-5K",
        name: "Scale Teaching Department",
        capacity: 1800,
        targetPercentage: 25.0,
      });
    teachingDeptId = tRes.body.data.department.id;

    // 3. Prayer: 20%
    const pRes = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: scaleCampusId,
        code: "PRAY-5K",
        name: "Scale Prayer Department",
        capacity: 1500,
        targetPercentage: 20.0,
      });
    prayerDeptId = pRes.body.data.department.id;

    // 4. Evangelism: 15%
    const eRes = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: scaleCampusId,
        code: "EVANG-5K",
        name: "Scale Evangelism Department",
        capacity: 1200,
        targetPercentage: 15.0,
      });
    evangelismDeptId = eRes.body.data.department.id;

    // 5. Social Service: 10%
    const sRes = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: scaleCampusId,
        code: "SOC-5K",
        name: "Scale Social Service",
        capacity: 1000,
        targetPercentage: 10.0,
      });
    socialDeptId = sRes.body.data.department.id;

    expect(choirDeptId).toBeDefined();
    expect(teachingDeptId).toBeDefined();
    expect(prayerDeptId).toBeDefined();
    expect(evangelismDeptId).toBeDefined();
    expect(socialDeptId).toBeDefined();
  });

  it("seeds 5,000 diverse church campus members into database", async () => {
    const adminUser = {
      userId: "f0000000-0000-0000-0000-000000000001",
      email: "admin@c-cimas.org",
      fullName: "Admin",
      campusId: scaleCampusId,
      role: "ADMIN" as const,
      permissions: ["member.register"],
    };

    const categories = ["YOUTH", "STUDENT", "YOUNG_ADULT", "ADULT", "ELDER"] as const;
    const spiritualStatuses = ["DEACON", "SERVANT", "REGULAR"] as const;

    const memberRows = [];
    for (let i = 1; i <= 5000; i++) {
      const gender = i % 2 === 0 ? "FEMALE" : "MALE";
      const cat = categories[i % categories.length];
      const spirit = spiritualStatuses[i % spiritualStatuses.length];

      memberRows.push({
        campusId: scaleCampusId,
        memberId: `SCALE-MEM-${i.toString().padStart(5, "0")}`,
        firstName: `MemberFirstName${i}`,
        lastName: `MemberLastName${i}`,
        gender: gender as "MALE" | "FEMALE",
        category: cat,
        spiritualStatus: spirit,
        educationLevel: "Undergraduate",
        phoneNumber: `+251911${(100000 + (i % 899999)).toString()}`,
        email: `member${i}@scale-test.org`,
      });
    }

    // Direct high-speed bulk ingestion
    await MemberService.batchCreate(memberRows, adminUser);

    const { pagination } = await MemberService.getAll({ campusId: scaleCampusId, limit: 1 }, adminUser);
    expect(pagination.total).toBe(5000);
  }, 30000); // 30s timeout for 5,000 member batch generation

  it("executes Intelligent Allocation Engine on 5,000 members and verifies Option A 100% accounting", async () => {
    const startTime = Date.now();

    const res = await request(app)
      .post("/api/v1/allocations/run")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        campusId: scaleCampusId,
        cycleName: "2026 5,000 Members Grand Allocation Cycle",
      });

    const elapsedMs = Date.now() - startTime;
    console.log(`ALLOCATION BENCHMARK: 5,000 members processed in ${elapsedMs}ms`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const batch = res.body.data.batch;

    expect(batch.totalMembers).toBe(5000);

    // Option A Requirement: Every member must be accounted for (allocated + exceptions = total)
    expect(batch.allocatedCount + batch.exceptionCount).toBe(5000);

    // Largest Remainder Verification: Target Counts
    const targets = batch.targets;
    const choirTarget = targets.find((t: { departmentCode: string }) => t.departmentCode === "CHOIR-5K");
    const teachTarget = targets.find((t: { departmentCode: string }) => t.departmentCode === "TEACH-5K");
    const prayTarget = targets.find((t: { departmentCode: string }) => t.departmentCode === "PRAY-5K");
    const evangTarget = targets.find((t: { departmentCode: string }) => t.departmentCode === "EVANG-5K");
    const socTarget = targets.find((t: { departmentCode: string }) => t.departmentCode === "SOC-5K");

    expect(choirTarget.targetCount).toBe(1500); // 30% of 5000
    expect(teachTarget.targetCount).toBe(1250); // 25% of 5000
    expect(prayTarget.targetCount).toBe(1000); // 20% of 5000
    expect(evangTarget.targetCount).toBe(750);  // 15% of 5000
    expect(socTarget.targetCount).toBe(500);   // 10% of 5000

    // Sum of targets must equal 5,000 exactly
    const targetSum = targets.reduce((acc: number, t: { targetCount: number }) => acc + t.targetCount, 0);
    expect(targetSum).toBe(5000);

    // Department capacity checks: allocations must not exceed department capacity
    expect(choirTarget.allocatedCount).toBeLessThanOrEqual(choirTarget.capacity);
    expect(teachTarget.allocatedCount).toBeLessThanOrEqual(teachTarget.capacity);
    expect(prayTarget.allocatedCount).toBeLessThanOrEqual(prayTarget.capacity);
    expect(evangTarget.allocatedCount).toBeLessThanOrEqual(evangTarget.capacity);
    expect(socTarget.allocatedCount).toBeLessThanOrEqual(socTarget.capacity);
  }, 30000);
});
