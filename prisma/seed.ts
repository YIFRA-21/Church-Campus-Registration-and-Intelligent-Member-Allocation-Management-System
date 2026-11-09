import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting C-CIMAS database seeding...");

  // Clear existing records to ensure clean idempotent seed
  await prisma.auditLog.deleteMany();
  await prisma.allocationException.deleteMany();
  await prisma.allocationProposal.deleteMany();
  await prisma.memberAllocation.deleteMany();
  await prisma.allocationBatch.deleteMany();
  await prisma.departmentTransferRequest.deleteMany();
  await prisma.departmentBalancingRule.deleteMany();
  await prisma.departmentEligibilityRule.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.campus.deleteMany();

  // 1. Create Campuses
  const mainCampus = await prisma.campus.create({
    data: {
      code: "ADD-01",
      name: "Main Campus (Addis Ababa)",
      city: "Addis Ababa",
      active: true,
    },
  });

  const boleCampus = await prisma.campus.create({
    data: {
      code: "BOL-02",
      name: "Bole Sub-Campus",
      city: "Addis Ababa",
      active: true,
    },
  });

  console.log("Created campuses:", mainCampus.name, boleCampus.name);

  // 2. Create Departments for Main Campus
  const choirDept = await prisma.department.create({
    data: {
      campusId: mainCampus.id,
      name: "Choir & Music Ministry",
      code: "CHOIR",
      description: "Vocalists, instrumentalists, and liturgical choir",
      targetPercent: 0.30, // 30% of eligible
      maxCapacity: 20,
      priority: 1,
      status: "ACTIVE",
      eligibilityRules: {
        create: {
          allowedGenders: "ALL",
          allowedCategories: JSON.stringify(["Youth", "Adult", "Student", "Young Adult"]),
          requiresDeacon: null,
          active: true,
        },
      },
      balancingRules: {
        create: {
          constraintType: "SOFT",
          targetMaleRatio: 0.5,
          targetFemaleRatio: 0.5,
        },
      },
    },
  });

  const usheringDept = await prisma.department.create({
    data: {
      campusId: mainCampus.id,
      name: "Ushering & Protocol",
      code: "USHER",
      description: "Guest hospitality, sanctuary order, and protocol service",
      targetPercent: 0.25,
      maxCapacity: 15,
      priority: 2,
      status: "ACTIVE",
      eligibilityRules: {
        create: {
          allowedGenders: "ALL",
          allowedCategories: JSON.stringify(["Adult", "Youth", "Elder"]),
          requiresDeacon: null,
          active: true,
        },
      },
      balancingRules: {
        create: {
          constraintType: "SOFT",
          targetMaleRatio: 0.5,
          targetFemaleRatio: 0.5,
        },
      },
    },
  });

  const mediaDept = await prisma.department.create({
    data: {
      campusId: mainCampus.id,
      name: "Media, Sound & Tech",
      code: "MEDIA",
      description: "Audio-visual broadcasting, sound engineering, and IT",
      targetPercent: 0.20,
      maxCapacity: 10,
      priority: 3,
      status: "ACTIVE",
      eligibilityRules: {
        create: {
          allowedGenders: "ALL",
          allowedCategories: JSON.stringify(["Youth", "Student", "Young Adult"]),
          requiresDeacon: null,
          active: true,
        },
      },
    },
  });

  const childrenDept = await prisma.department.create({
    data: {
      campusId: mainCampus.id,
      name: "Children Ministry & Sunday School",
      code: "CHILDREN",
      description: "Childcare, biblical teaching, and youth mentorship",
      targetPercent: 0.20,
      maxCapacity: 12,
      priority: 2,
      status: "ACTIVE",
      eligibilityRules: {
        create: {
          allowedGenders: "ALL",
          allowedCategories: JSON.stringify(["Adult", "Elder"]),
          requiresDeacon: null,
          active: true,
        },
      },
    },
  });

  const diaconateDept = await prisma.department.create({
    data: {
      campusId: mainCampus.id,
      name: "Diaconate & Altar Service",
      code: "DEACON",
      description: "Liturgical assistance and consecrated sanctuary duties",
      targetPercent: 0.50,
      maxCapacity: 8,
      priority: 1,
      status: "ACTIVE",
      eligibilityRules: {
        create: {
          allowedGenders: "MALE",
          allowedCategories: "ALL",
          requiresDeacon: true, // STRICT DEACON REQUIREMENT
          active: true,
        },
      },
    },
  });

  console.log("Created 5 departments with eligibility and capacity rules.");

  // 3. Create Users with Hashed Passwords
  const passwordHash = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@c-cimas.org",
      passwordHash,
      fullName: "Rev. Solomon Tadesse",
      role: "SUPER_ADMIN",
      campusId: null,
    },
  });

  const campusAdmin = await prisma.user.create({
    data: {
      email: "campusadmin@c-cimas.org",
      passwordHash,
      fullName: "Daniel Bekele",
      role: "CAMPUS_ADMIN",
      campusId: mainCampus.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "regofficer@c-cimas.org",
      passwordHash,
      fullName: "Hanna Girma",
      role: "REGISTRATION_OFFICER",
      campusId: mainCampus.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "choirlead@c-cimas.org",
      passwordHash,
      fullName: "Yonas Alemu",
      role: "DEPT_MANAGER",
      campusId: mainCampus.id,
      departmentId: choirDept.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "evaluator@c-cimas.org",
      passwordHash,
      fullName: "Dr. Aster Melaku",
      role: "EVALUATOR",
      campusId: mainCampus.id,
    },
  });

  console.log("Created administrative users across all 5 roles.");

  // 4. Create 30 Initial Sample Members
  const sampleMembersData = [
    // Deacons (Male, any category)
    { fullName: "Deacon Yohannes Wolde", phone: "+251911223344", gender: "MALE", category: "Adult", isDeacon: true },
    { fullName: "Deacon Petros Tefera", phone: "+251911334455", gender: "MALE", category: "Youth", isDeacon: true },
    { fullName: "Deacon Michael Hailu", phone: "+251911445566", gender: "MALE", category: "Adult", isDeacon: true },
    { fullName: "Deacon Samuel Kebede", phone: "+251911556677", gender: "MALE", category: "Elder", isDeacon: true },

    // Youth Members (Media, Choir, etc.)
    { fullName: "Elias Worku", phone: "+251922110001", gender: "MALE", category: "Youth", isDeacon: false },
    { fullName: "Abel Mesfin", phone: "+251922110002", gender: "MALE", category: "Youth", isDeacon: false },
    { fullName: "Bethlehem Assefa", phone: "+251922110003", gender: "FEMALE", category: "Youth", isDeacon: false },
    { fullName: "Sara Tesfaye", phone: "+251922110004", gender: "FEMALE", category: "Youth", isDeacon: false },
    { fullName: "Naod Mengistu", phone: "+251922110005", gender: "MALE", category: "Youth", isDeacon: false },
    { fullName: "Ruth Negash", phone: "+251922110006", gender: "FEMALE", category: "Youth", isDeacon: false },

    // Students (Media, Choir)
    { fullName: "Kidus Desta", phone: "+251933220001", gender: "MALE", category: "Student", isDeacon: false },
    { fullName: "Selamawit Fikru", phone: "+251933220002", gender: "FEMALE", category: "Student", isDeacon: false },
    { fullName: "Lydia Berhanu", phone: "+251933220003", gender: "FEMALE", category: "Student", isDeacon: false },
    { fullName: "Binyam Kassahun", phone: "+251933220004", gender: "MALE", category: "Student", isDeacon: false },

    // Adults (Choir, Ushering, Children)
    { fullName: "Tewodros Kassaye", phone: "+251944330001", gender: "MALE", category: "Adult", isDeacon: false },
    { fullName: "Mulugeta Gebre", phone: "+251944330002", gender: "MALE", category: "Adult", isDeacon: false },
    { fullName: "Almaz Demissie", phone: "+251944330003", gender: "FEMALE", category: "Adult", isDeacon: false },
    { fullName: "Genet Tadesse", phone: "+251944330004", gender: "FEMALE", category: "Adult", isDeacon: false },
    { fullName: "Dawit Sisay", phone: "+251944330005", gender: "MALE", category: "Adult", isDeacon: false },
    { fullName: "Helen Kifle", phone: "+251944330006", gender: "FEMALE", category: "Adult", isDeacon: false },
    { fullName: "Getachew Zeleke", phone: "+251944330007", gender: "MALE", category: "Adult", isDeacon: false },
    { fullName: "Tirhas Haile", phone: "+251944330008", gender: "FEMALE", category: "Adult", isDeacon: false },

    // Elders (Ushering, Children)
    { fullName: "Ato Berhanu Lemma", phone: "+251955440001", gender: "MALE", category: "Elder", isDeacon: false },
    { fullName: "W/ro Abebech Belay", phone: "+251955440002", gender: "FEMALE", category: "Elder", isDeacon: false },
    { fullName: "Ato Gizaw Mamo", phone: "+251955440003", gender: "MALE", category: "Elder", isDeacon: false },
    { fullName: "W/ro Yeshimebet Shibashi", phone: "+251955440004", gender: "FEMALE", category: "Elder", isDeacon: false },

    // Out-of-category members (To test Exception Review Queue!)
    { fullName: "Ezra Shimeles", phone: "+251966550001", gender: "MALE", category: "Visitor", isDeacon: false },
    { fullName: "Mahlet Bogale", phone: "+251966550002", gender: "FEMALE", category: "Visitor", isDeacon: false },
  ];

  let regIndex = 1001;
  for (const m of sampleMembersData) {
    await prisma.member.create({
      data: {
        campusId: mainCampus.id,
        registrationNo: `REG-${regIndex++}`,
        fullName: m.fullName,
        phoneNumber: m.phone,
        gender: m.gender,
        category: m.category,
        isDeacon: m.isDeacon,
        status: "ACTIVE",
      },
    });
  }

  console.log(`Seeded ${sampleMembersData.length} members with diverse profiles and attributes.`);
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

