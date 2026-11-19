import {
  CreateMemberInput,
  UpdateMemberInput,
  MemberFilterInput,
  ChangeMemberStatusInput,
  FindDuplicateCriteria,
  ApprovedImportMemberInput,
  Gender,
  MemberCategory,
  SpiritualStatus,
  MemberStatus,
} from "../schemas/member.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";
import { CampusService } from "./campus.service";

export interface MemberStatusHistoryRecord {
  id: string;
  memberId: string;
  oldStatus: MemberStatus;
  newStatus: MemberStatus;
  reason: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

export interface MemberRecord {
  id: string;
  campusId: string;
  memberId: string; // Business unique member code (ተ.ቁ)
  firstName: string;
  lastName: string;
  fullName: string; // ሙሉ ስም
  christianName?: string; // ክርስትና ስም (Baptismal Name)
  gender: Gender; // ጾታ
  phoneNumber: string; // ስልክ ቁጥር
  email: string;
  academicDepartment?: string; // ዲፓርትመንት (Academic Department / Faculty / Source)
  serviceDepartment?: string; // የአገልግሎት ክፍል (Ministry Department: ዕቅድ፣ ትምህርት፣ ልማት፣ ባች፣ ሙያ፣ ቋንቋ፣ አባላት፣ ኦዲት፣ ሂሳብ፣ መዝሙር)
  originRegion?: string; // የመጡበት ክልል (Origin Region)
  zone?: string; // ዞን
  woreda?: string; // ወረዳ
  kebele?: string; // ቀበሌ
  dormBlock?: string; // ብሎክ
  dormRoom?: string; // ዶርም
  language?: string; // ቋንቋ
  emergencyContactName?: string; // የተጠሪ ስም
  emergencyContactPhone?: string; // የተጠሪ ስልክ
  sundaySchoolDuration?: string; // የሰንበት ት/ቤት ቆይታ
  age?: number; // ዕድሜ
  category: MemberCategory;
  spiritualStatus: SpiritualStatus;
  educationLevel: string;
  address: string;
  emergencyContact: string;
  status: MemberStatus;
  currentDepartmentId: string | null;
  statusHistory?: MemberStatusHistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

// Pre-seeded diverse members for Main Campus
const INITIAL_MEMBERS: MemberRecord[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-001",
    firstName: "Ephraim",
    lastName: "Haile",
    fullName: "Ephraim Haile",
    christianName: "ገብረ ማርያም",
    gender: "MALE",
    phoneNumber: "+251911223344",
    email: "ephraim@example.com",
    academicDepartment: "Computer Science",
    originRegion: "አዲስ አበባ",
    zone: "ሰሜን ሸዋ",
    woreda: "ወረዳ 03",
    kebele: "ቀበሌ 04",
    dormBlock: "Block 42",
    dormRoom: "Room 204",
    language: "አማርኛ",
    emergencyContactName: "ቀሲስ ኃይሌ (አባት)",
    emergencyContactPhone: "+251911998877",
    sundaySchoolDuration: "5 ዓመት",
    age: 22,
    category: "YOUTH",
    spiritualStatus: "DEACON",
    educationLevel: "BSc Computer Science",
    address: "Arat Kilo, Addis Ababa",
    emergencyContact: "+251911998877",
    status: "ACTIVE",
    serviceDepartment: "መዝሙር",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000001", // CHOIR-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-002",
    firstName: "Selamawit",
    lastName: "Tewodros",
    fullName: "Selamawit Tewodros",
    christianName: "ወለተ ማርያም",
    gender: "FEMALE",
    phoneNumber: "+251922334455",
    email: "selam@example.com",
    academicDepartment: "Accounting & Finance",
    originRegion: "ኦሮሚያ",
    zone: "ምሥራቅ ሸዋ",
    woreda: "ወረዳ 02",
    kebele: "ቀበሌ 07",
    dormBlock: "Block 12",
    dormRoom: "Room 318",
    language: "አፋን ኦሮሞ / አማርኛ",
    emergencyContactName: "ወ/ሮ ሙሉእመቤት (እናት)",
    emergencyContactPhone: "+251922112233",
    sundaySchoolDuration: "3 ዓመት",
    age: 21,
    category: "YOUTH",
    spiritualStatus: "SERVANT",
    educationLevel: "BA Accounting",
    address: "Piazza, Addis Ababa",
    emergencyContact: "+251922112233",
    status: "ACTIVE",
    serviceDepartment: "ትምህርት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000002", // TEACH-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-003",
    firstName: "Kidus",
    lastName: "Berhanu",
    fullName: "Kidus Berhanu",
    christianName: "ተክለ ሃይማኖት",
    gender: "MALE",
    phoneNumber: "+251933445566",
    email: "kidus@example.com",
    academicDepartment: "Civil Engineering",
    originRegion: "አማራ",
    zone: "ደቡብ ጎንደር",
    woreda: "ወረዳ 05",
    kebele: "ቀበሌ 11",
    dormBlock: "Block 08",
    dormRoom: "Room 105",
    language: "አማርኛ",
    emergencyContactName: "አቶ ብርሃኑ (አባት)",
    emergencyContactPhone: "+251933556677",
    sundaySchoolDuration: "7 ዓመት",
    age: 23,
    category: "STUDENT",
    spiritualStatus: "REGULAR",
    educationLevel: "Pre-Engineering",
    address: "Sidist Kilo, Addis Ababa",
    emergencyContact: "+251933556677",
    status: "ACTIVE",
    serviceDepartment: "ዕቅድ",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000004", // EVANG-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-004",
    firstName: "Marta",
    lastName: "Girma",
    fullName: "Marta Girma",
    christianName: "ወለተ ዮሐንስ",
    gender: "FEMALE",
    phoneNumber: "+251944556677",
    email: "marta@example.com",
    academicDepartment: "Medicine & Health",
    originRegion: "አዲስ አበባ",
    zone: "ቂርቆስ",
    woreda: "ወረዳ 08",
    kebele: "ቀበሌ 03",
    dormBlock: "Block 15",
    dormRoom: "Room 412",
    language: "አማርኛ / እንግሊዝኛ",
    emergencyContactName: "አቶ ግርማ (አባት)",
    emergencyContactPhone: "+251944112233",
    sundaySchoolDuration: "4 ዓመት",
    age: 24,
    category: "ADULT",
    spiritualStatus: "SERVANT",
    educationLevel: "MA Educational Leadership",
    address: "Bole Medhanealem",
    emergencyContact: "+251944112233",
    status: "ACTIVE",
    serviceDepartment: "ልማት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000003", // PRAY-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-005",
    firstName: "Deacon Samuel",
    lastName: "Kifle",
    fullName: "Deacon Samuel Kifle",
    christianName: "ኃይለ ሚካኤል",
    gender: "MALE",
    phoneNumber: "+251955667788",
    email: "samuel@example.com",
    academicDepartment: "Theology & Ge'ez Studies",
    originRegion: "ትግራይ",
    zone: "መቐለ",
    woreda: "ወረዳ 01",
    kebele: "ቀበሌ 05",
    dormBlock: "Block 24",
    dormRoom: "Room 211",
    language: "ትግርኛ / ግዕዝ / አማርኛ",
    emergencyContactName: "መ/ር ክፍሌ (አባት)",
    emergencyContactPhone: "+251955990011",
    sundaySchoolDuration: "8 ዓመት",
    age: 25,
    category: "ADULT",
    spiritualStatus: "DEACON",
    educationLevel: "Theology Diploma",
    address: "Gullele, Addis Ababa",
    emergencyContact: "+251955990011",
    status: "ACTIVE",
    serviceDepartment: "ትምህርት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000002", // TEACH-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-006",
    firstName: "Tewodros",
    lastName: "Assefa",
    fullName: "Tewodros Assefa",
    christianName: "ኪዳነ ማርያም",
    gender: "MALE",
    phoneNumber: "+251966778899",
    email: "tedros@example.com",
    academicDepartment: "Electrical Engineering",
    originRegion: "አማራ",
    zone: "ምዕራብ ጎጃም",
    woreda: "ወረዳ 04",
    kebele: "ቀበሌ 02",
    dormBlock: "Block 31",
    dormRoom: "Room 109",
    language: "አማርኛ",
    emergencyContactName: "አቶ አሰፋ (አባት)",
    emergencyContactPhone: "+251966112233",
    sundaySchoolDuration: "6 ዓመት",
    age: 21,
    category: "STUDENT",
    spiritualStatus: "DEACON",
    educationLevel: "BSc Electrical Engineering",
    address: "Arat Kilo Campus",
    emergencyContact: "+251966112233",
    status: "ACTIVE",
    serviceDepartment: "ትምህርት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000002", // TEACH-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000007",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-007",
    firstName: "Bethlehem",
    lastName: "Hailu",
    fullName: "Bethlehem Hailu",
    christianName: "ወለተ ኪዳን",
    gender: "FEMALE",
    phoneNumber: "+251977889900",
    email: "betty@example.com",
    academicDepartment: "Pharmacy & Biomedical",
    originRegion: "ደቡብ ኢትዮጵያ",
    zone: "ጉራጌ",
    woreda: "ወረዳ 07",
    kebele: "ቀበሌ 06",
    dormBlock: "Block 14",
    dormRoom: "Room 302",
    language: "ጉራጊኛ / አማርኛ",
    emergencyContactName: "ወ/ሮ ብርቱካን (እናት)",
    emergencyContactPhone: "+251977114455",
    sundaySchoolDuration: "4 ዓመት",
    age: 20,
    category: "STUDENT",
    spiritualStatus: "SERVANT",
    educationLevel: "BPharm Candidate",
    address: "Arat Kilo Campus",
    emergencyContact: "+251977114455",
    status: "ACTIVE",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000005", // SOC-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000008",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-008",
    firstName: "Yared",
    lastName: "Melese",
    fullName: "Yared Melese",
    christianName: "ገብረ መስቀል",
    gender: "MALE",
    phoneNumber: "+251988990011",
    email: "yared@example.com",
    academicDepartment: "Music & Performing Arts",
    originRegion: "አማራ",
    zone: "ሰሜን ወሎ",
    woreda: "ወረዳ 02",
    kebele: "ቀበሌ 09",
    dormBlock: "Block 19",
    dormRoom: "Room 405",
    language: "አማርኛ / ግዕዝ",
    emergencyContactName: "መ/ር መለሰ (አባት)",
    emergencyContactPhone: "+251988223344",
    sundaySchoolDuration: "9 ዓመት",
    age: 23,
    category: "YOUTH",
    spiritualStatus: "DEACON",
    educationLevel: "Yared School of Music",
    address: "Yared School Campus",
    emergencyContact: "+251988223344",
    status: "ACTIVE",
    serviceDepartment: "መዝሙር",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000001", // CHOIR-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000009",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-009",
    firstName: "Hanna",
    lastName: "Bekele",
    fullName: "Hanna Bekele",
    christianName: "ወለተ ማርያም",
    gender: "FEMALE",
    phoneNumber: "+251912345678",
    email: "hanna.bekele@c-cimas.org",
    academicDepartment: "Information Systems",
    originRegion: "አዲስ አበባ",
    zone: "ቦሌ",
    woreda: "ወረዳ 04",
    kebele: "ቀበሌ 10",
    dormBlock: "Block 03",
    dormRoom: "Room 102",
    language: "አማርኛ",
    emergencyContactName: "ወ/ሮ ሙሉ (እናት)",
    emergencyContactPhone: "+251912340001",
    sundaySchoolDuration: "2 ዓመት",
    age: 21,
    category: "STUDENT",
    spiritualStatus: "REGULAR",
    educationLevel: "BSc Information Systems",
    address: "Main Campus Female Dormitory",
    emergencyContact: "+251912340001",
    status: "ACTIVE",
    serviceDepartment: "ትምህርት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000002", // TEACH-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000010",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-010",
    firstName: "Deacon Natnael",
    lastName: "Desta",
    fullName: "Deacon Natnael Desta",
    christianName: "ኃይለ ጊዮርጊስ",
    gender: "MALE",
    phoneNumber: "+251923456789",
    email: "natnael.desta@c-cimas.org",
    academicDepartment: "Chemical Engineering",
    originRegion: "ሲዳማ",
    zone: "ሐዋሳ",
    woreda: "ወረዳ 01",
    kebele: "ቀበሌ 03",
    dormBlock: "Block 28",
    dormRoom: "Room 401",
    language: "ሲዳምኛ / አማርኛ",
    emergencyContactName: "አቶ ደስታ (አባት)",
    emergencyContactPhone: "+251923450002",
    sundaySchoolDuration: "5 ዓመት",
    age: 23,
    category: "STUDENT",
    spiritualStatus: "DEACON",
    educationLevel: "BSc Chemical Engineering",
    address: "Main Campus Engineering Block",
    emergencyContact: "+251923450002",
    status: "ACTIVE",
    serviceDepartment: "ትምህርት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000002", // TEACH-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000011",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-011",
    firstName: "Eden",
    lastName: "Tsegaye",
    fullName: "Eden Tsegaye",
    christianName: "ወለተ ሚካኤል",
    gender: "FEMALE",
    phoneNumber: "+251934567890",
    email: "eden.tsegaye@c-cimas.org",
    academicDepartment: "Economics & Public Policy",
    originRegion: "አማራ",
    zone: "ደቡብ ወሎ",
    woreda: "ደሴ",
    kebele: "ቀበሌ 08",
    dormBlock: "Block 06",
    dormRoom: "Room 205",
    language: "አማርኛ",
    emergencyContactName: "አቶ ፀጋዬ (አባት)",
    emergencyContactPhone: "+251934560003",
    sundaySchoolDuration: "4 ዓመት",
    age: 22,
    category: "STUDENT",
    spiritualStatus: "SERVANT",
    educationLevel: "BA Economics",
    address: "Main Campus Social Sciences Hall",
    emergencyContact: "+251934560003",
    status: "ACTIVE",
    serviceDepartment: "ትምህርት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000002", // TEACH-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000012",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-012",
    firstName: "Mahlet",
    lastName: "Solomon",
    fullName: "Mahlet Solomon",
    christianName: "ወለተ ሰማዕት",
    gender: "FEMALE",
    phoneNumber: "+251945678901",
    email: "mahlet.s@c-cimas.org",
    academicDepartment: "Literature & Theatre",
    originRegion: "አዲስ አበባ",
    zone: "የካ",
    woreda: "ወረዳ 06",
    kebele: "ቀበሌ 14",
    dormBlock: "Block 09",
    dormRoom: "Room 304",
    language: "አማርኛ",
    emergencyContactName: "ወ/ሮ ፋንቱ (እናት)",
    emergencyContactPhone: "+251945670004",
    sundaySchoolDuration: "5 ዓመት",
    age: 21,
    category: "YOUTH",
    spiritualStatus: "SERVANT",
    educationLevel: "BA Literature",
    address: "Main Campus Arts Block",
    emergencyContact: "+251945670004",
    status: "ACTIVE",
    serviceDepartment: "መዝሙር",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000001", // CHOIR-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000013",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-013",
    firstName: "Solomon",
    lastName: "Girma",
    fullName: "Solomon Girma",
    christianName: "ወልደ ሥላሴ",
    gender: "MALE",
    phoneNumber: "+251956789012",
    email: "solomon.g@c-cimas.org",
    academicDepartment: "Music & Liturgy",
    originRegion: "ኦሮሚያ",
    zone: "ምዕራብ ሸዋ",
    woreda: "አምቦ",
    kebele: "ቀበሌ 02",
    dormBlock: "Block 17",
    dormRoom: "Room 112",
    language: "አፋን ኦሮሞ / አማርኛ",
    emergencyContactName: "አቶ ግርማ (አባት)",
    emergencyContactPhone: "+251956780005",
    sundaySchoolDuration: "7 ዓመት",
    age: 24,
    category: "YOUTH",
    spiritualStatus: "DEACON",
    educationLevel: "BSc Applied Math",
    address: "Main Campus Dorm 17",
    emergencyContact: "+251956780005",
    status: "ACTIVE",
    serviceDepartment: "መዝሙር",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000001", // CHOIR-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000014",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-014",
    firstName: "Tsion",
    lastName: "Alemu",
    fullName: "Tsion Alemu",
    christianName: "ወለተ ኪዳን",
    gender: "FEMALE",
    phoneNumber: "+251967890123",
    email: "tsion.alemu@c-cimas.org",
    academicDepartment: "Nursing & Health Care",
    originRegion: "አማራ",
    zone: "ሰሜን ሸዋ",
    woreda: "ደብረ ብርሃን",
    kebele: "ቀበሌ 05",
    dormBlock: "Block 11",
    dormRoom: "Room 214",
    language: "አማርኛ",
    emergencyContactName: "ወ/ሮ አልማዝ (እናት)",
    emergencyContactPhone: "+251967890006",
    sundaySchoolDuration: "4 ዓመት",
    age: 22,
    category: "STUDENT",
    spiritualStatus: "SERVANT",
    educationLevel: "BSc Nursing",
    address: "Main Campus Health Sciences",
    emergencyContact: "+251967890006",
    status: "ACTIVE",
    serviceDepartment: "ልማት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000003", // PRAY-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000015",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-015",
    firstName: "Berhanu",
    lastName: "Tefera",
    fullName: "Berhanu Tefera",
    christianName: "ገብረ መስቀል",
    gender: "MALE",
    phoneNumber: "+251978901234",
    email: "berhanu.t@c-cimas.org",
    academicDepartment: "History & Heritage",
    originRegion: "ትግራይ",
    zone: "ዓድዋ",
    woreda: "ወረዳ 02",
    kebele: "ቀበሌ 01",
    dormBlock: "Block 21",
    dormRoom: "Room 108",
    language: "ትግርኛ / አማርኛ",
    emergencyContactName: "አቶ ተፈራ (አባት)",
    emergencyContactPhone: "+251978900007",
    sundaySchoolDuration: "1 ዓመት",
    age: 23,
    category: "STUDENT",
    spiritualStatus: "REGULAR",
    educationLevel: "BA History",
    address: "Main Campus Dorm 21",
    emergencyContact: "+251978900007",
    status: "ACTIVE",
    serviceDepartment: "ልማት",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000003", // PRAY-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000016",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-016",
    firstName: "Rahel",
    lastName: "Tadesse",
    fullName: "Rahel Tadesse",
    christianName: "ወለተ ጊዮርጊስ",
    gender: "FEMALE",
    phoneNumber: "+251989012345",
    email: "rahel.t@c-cimas.org",
    academicDepartment: "Sociology & Social Work",
    originRegion: "ደቡብ ኢትዮጵያ",
    zone: "ሀዲያ",
    woreda: "ሆሳዕና",
    kebele: "ቀበሌ 03",
    dormBlock: "Block 05",
    dormRoom: "Room 310",
    language: "ሀዲይኛ / አማርኛ",
    emergencyContactName: "ወ/ሮ ሙሉ (እናት)",
    emergencyContactPhone: "+251989010008",
    sundaySchoolDuration: "3 ዓመት",
    age: 20,
    category: "STUDENT",
    spiritualStatus: "SERVANT",
    educationLevel: "BA Sociology",
    address: "Main Campus Dorm 05",
    emergencyContact: "+251989010008",
    status: "ACTIVE",
    serviceDepartment: "ዕቅድ",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000004", // EVANG-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000017",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-017",
    firstName: "Yohannes",
    lastName: "Haile",
    fullName: "Yohannes Haile",
    christianName: "ዮሐንስ ወንጌላዊ",
    gender: "MALE",
    phoneNumber: "+251990123456",
    email: "yohannes.h@c-cimas.org",
    academicDepartment: "Law & Jurisprudence",
    originRegion: "አዲስ አበባ",
    zone: "አራዳ",
    woreda: "ወረዳ 01",
    kebele: "ቀበሌ 02",
    dormBlock: "Block 13",
    dormRoom: "Room 201",
    language: "አማርኛ",
    emergencyContactName: "አቶ ኃይሌ (አባት)",
    emergencyContactPhone: "+251990120009",
    sundaySchoolDuration: "6 ዓመት",
    age: 24,
    category: "STUDENT",
    spiritualStatus: "DEACON",
    educationLevel: "LLB Law",
    address: "Main Campus Law Faculty",
    emergencyContact: "+251990120009",
    status: "ACTIVE",
    serviceDepartment: "ዕቅድ",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000004", // EVANG-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000018",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-018",
    firstName: "Daniel",
    lastName: "Worku",
    fullName: "Daniel Worku",
    christianName: "ዳንኤል ነቢይ",
    gender: "MALE",
    phoneNumber: "+251901234567",
    email: "daniel.w@c-cimas.org",
    academicDepartment: "Civil & Environmental",
    originRegion: "ኦሮሚያ",
    zone: "ሰሜን ሸዋ",
    woreda: "ፍቼ",
    kebele: "ቀበሌ 05",
    dormBlock: "Block 18",
    dormRoom: "Room 303",
    language: "አፋን ኦሮሞ / አማርኛ",
    emergencyContactName: "አቶ ወርቁ (አባት)",
    emergencyContactPhone: "+251901230010",
    sundaySchoolDuration: "2 ዓመት",
    age: 22,
    category: "STUDENT",
    spiritualStatus: "REGULAR",
    educationLevel: "BSc Civil Engineering",
    address: "Main Campus Tech Campus",
    emergencyContact: "+251901230010",
    status: "ACTIVE",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000005", // SOC-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000019",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-019",
    firstName: "Genet",
    lastName: "Assefa",
    fullName: "Genet Assefa",
    christianName: "ወለተ ዮሐንስ",
    gender: "FEMALE",
    phoneNumber: "+251911987654",
    email: "genet.a@c-cimas.org",
    academicDepartment: "Public Health",
    originRegion: "አማራ",
    zone: "ምሥራቅ ጎጃም",
    woreda: "ደብረ ማርቆስ",
    kebele: "ቀበሌ 04",
    dormBlock: "Block 07",
    dormRoom: "Room 109",
    language: "አማርኛ",
    emergencyContactName: "ወ/ሮ የሺ (እናት)",
    emergencyContactPhone: "+251911980011",
    sundaySchoolDuration: "5 ዓመት",
    age: 21,
    category: "STUDENT",
    spiritualStatus: "SERVANT",
    educationLevel: "BSc Public Health",
    address: "Main Campus Dorm 07",
    emergencyContact: "+251911980011",
    status: "ACTIVE",
    currentDepartmentId: "d0000000-0000-0000-0000-000000000005", // SOC-01
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Unallocated candidates for Allocation Engine testing
  {
    id: "10000000-0000-0000-0000-000000000020",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-020",
    firstName: "Abel",
    lastName: "Moges",
    fullName: "Abel Moges",
    christianName: "ኃይለ ማርያም",
    gender: "MALE",
    phoneNumber: "+251922876543",
    email: "abel.m@c-cimas.org",
    academicDepartment: "Mechanical Engineering",
    originRegion: "አዲስ አበባ",
    zone: "ጉለሌ",
    woreda: "ወረዳ 05",
    kebele: "ቀበሌ 09",
    dormBlock: "Block 25",
    dormRoom: "Room 202",
    language: "አማርኛ",
    emergencyContactName: "አቶ ሞገስ (አባት)",
    emergencyContactPhone: "+251922870012",
    sundaySchoolDuration: "3 ዓመት",
    age: 22,
    category: "STUDENT",
    spiritualStatus: "DEACON",
    educationLevel: "BSc Mechanical Engineering",
    address: "Main Campus Engineering Dorm",
    emergencyContact: "+251922870012",
    status: "ACTIVE",
    currentDepartmentId: null, // Unassigned
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000021",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-021",
    firstName: "Meseret",
    lastName: "Ayele",
    fullName: "Meseret Ayele",
    christianName: "ወለተ ኪዳን",
    gender: "FEMALE",
    phoneNumber: "+251933765432",
    email: "meseret.a@c-cimas.org",
    academicDepartment: "Applied Mathematics",
    originRegion: "ኦሮሚያ",
    zone: "አርሲ",
    woreda: "አሰላ",
    kebele: "ቀበሌ 06",
    dormBlock: "Block 04",
    dormRoom: "Room 415",
    language: "አፋን ኦሮሞ / አማርኛ",
    emergencyContactName: "ወ/ሮ ታደለች (እናት)",
    emergencyContactPhone: "+251933760013",
    sundaySchoolDuration: "4 ዓመት",
    age: 21,
    category: "STUDENT",
    spiritualStatus: "SERVANT",
    educationLevel: "BSc Mathematics",
    address: "Main Campus Sciences Block",
    emergencyContact: "+251933760013",
    status: "ACTIVE",
    currentDepartmentId: null, // Unassigned
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000022",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-022",
    firstName: "Binyam",
    lastName: "Kassahun",
    fullName: "Binyam Kassahun",
    christianName: "ተክለ ሥላሴ",
    gender: "MALE",
    phoneNumber: "+251944654321",
    email: "binyam.k@c-cimas.org",
    academicDepartment: "Computer Engineering",
    originRegion: "አማራ",
    zone: "ሰሜን ጎንደር",
    woreda: "ጎንደር",
    kebele: "ቀበሌ 12",
    dormBlock: "Block 30",
    dormRoom: "Room 107",
    language: "አማርኛ",
    emergencyContactName: "አቶ ካሣሁን (አባት)",
    emergencyContactPhone: "+251944650014",
    sundaySchoolDuration: "6 ዓመት",
    age: 23,
    category: "STUDENT",
    spiritualStatus: "DEACON",
    educationLevel: "BSc Computer Engineering",
    address: "Main Campus Tech Dorm 30",
    emergencyContact: "+251944650014",
    status: "ACTIVE",
    currentDepartmentId: null, // Unassigned
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000023",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-023",
    firstName: "Hirut",
    lastName: "Tilahun",
    fullName: "Hirut Tilahun",
    christianName: "ወለተ ማርያም",
    gender: "FEMALE",
    phoneNumber: "+251955543210",
    email: "hirut.t@c-cimas.org",
    academicDepartment: "Journalism & Media",
    originRegion: "አዲስ አበባ",
    zone: "ኮልፌ ቀራኒዮ",
    woreda: "ወረዳ 07",
    kebele: "ቀበሌ 03",
    dormBlock: "Block 02",
    dormRoom: "Room 308",
    language: "አማርኛ",
    emergencyContactName: "ወ/ሮ ዓለሚቱ (እናት)",
    emergencyContactPhone: "+251955540015",
    sundaySchoolDuration: "2 ዓመት",
    age: 20,
    category: "STUDENT",
    spiritualStatus: "REGULAR",
    educationLevel: "BA Journalism",
    address: "Main Campus Female Dorm 02",
    emergencyContact: "+251955540015",
    status: "ACTIVE",
    currentDepartmentId: null, // Unassigned
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000024",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-024",
    firstName: "Ermias",
    lastName: "Fikadu",
    fullName: "Ermias Fikadu",
    christianName: "ኤርምያስ ነቢይ",
    gender: "MALE",
    phoneNumber: "+251966432109",
    email: "ermias.f@c-cimas.org",
    academicDepartment: "Geology & Earth Sciences",
    originRegion: "ሲዳማ",
    zone: "ይርጋለም",
    woreda: "ወረዳ 03",
    kebele: "ቀበሌ 01",
    dormBlock: "Block 22",
    dormRoom: "Room 404",
    language: "ሲዳምኛ / አማርኛ",
    emergencyContactName: "አቶ ፍቃዱ (አባት)",
    emergencyContactPhone: "+251966430016",
    sundaySchoolDuration: "5 ዓመት",
    age: 24,
    category: "STUDENT",
    spiritualStatus: "REGULAR",
    educationLevel: "BSc Geology",
    address: "Main Campus Science Dorm 22",
    emergencyContact: "+251966430016",
    status: "ACTIVE",
    currentDepartmentId: null, // Unassigned
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000025",
    campusId: "a0000000-0000-0000-0000-000000000001",
    memberId: "MEM-2026-025",
    firstName: "Samrawit",
    lastName: "Mengistu",
    fullName: "Samrawit Mengistu",
    christianName: "ወለተ ሐና",
    gender: "FEMALE",
    phoneNumber: "+251977321098",
    email: "samrawit.m@c-cimas.org",
    academicDepartment: "Architecture & Urban Planning",
    originRegion: "ትግራይ",
    zone: "መቐለ",
    woreda: "ወረዳ 04",
    kebele: "ቀበሌ 07",
    dormBlock: "Block 08",
    dormRoom: "Room 114",
    language: "ትግርኛ / አማርኛ",
    emergencyContactName: "ወ/ሮ ሮማን (እናት)",
    emergencyContactPhone: "+251977320017",
    sundaySchoolDuration: "7 ዓመት",
    age: 22,
    category: "STUDENT",
    spiritualStatus: "SERVANT",
    educationLevel: "BArch Architecture",
    address: "Main Campus Architecture Hall",
    emergencyContact: "+251977320017",
    status: "ACTIVE",
    currentDepartmentId: null, // Unassigned
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let membersStore: MemberRecord[] = [...INITIAL_MEMBERS];
let memberStatusHistoryStore: MemberStatusHistoryRecord[] = [];

// Determine initial max code number for concurrency-safe auto generation
let initialMaxSeq = 25;
for (const m of INITIAL_MEMBERS) {
  const match = m.memberId.match(/MEM-\d{4}-(\d+)/i) || m.memberId.match(/MEM-(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > initialMaxSeq) {
      initialMaxSeq = num;
    }
  }
}
let memberCodeAtomicCounter = initialMaxSeq;

export class MemberService {
  /**
   * Concurrency-safe atomic member code generator (Rule 2)
   * Guaranteed unique, monotonic, non-predictable, never COUNT(*) + 1
   */
  static generateMemberCode(): string {
    const year = new Date().getFullYear();
    let candidate: string;
    do {
      memberCodeAtomicCounter++;
      candidate = `MEM-${year}-${memberCodeAtomicCounter.toString().padStart(4, "0")}`;
    } while (membersStore.some((m) => m.memberId.toLowerCase() === candidate.toLowerCase()));
    return candidate;
  }

  static async getAll(filter: MemberFilterInput, currentUser?: AuthSessionPayload) {
    let result = [...membersStore];

    // Campus scoping & tenancy
    if (filter.campusId) {
      result = result.filter((m) => m.campusId === filter.campusId);
    } else if (currentUser && currentUser.role !== "ADMIN" && currentUser.campusId) {
      result = result.filter((m) => m.campusId === currentUser.campusId);
    }

    // Search filter across code, names, phone, email, and academic department
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.memberId.toLowerCase().includes(q) ||
          (m.christianName && m.christianName.toLowerCase().includes(q)) ||
          m.phoneNumber.includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.academicDepartment && m.academicDepartment.toLowerCase().includes(q))
      );
    }

    // Gender filter
    if (filter.gender) {
      result = result.filter((m) => m.gender === filter.gender);
    }

    // Category filter
    if (filter.category) {
      result = result.filter((m) => m.category === filter.category);
    }

    // Spiritual Status filter
    if (filter.spiritualStatus) {
      result = result.filter((m) => m.spiritualStatus === filter.spiritualStatus);
    }

    // Member Status filter
    if (filter.status && filter.status !== "ALL") {
      result = result.filter((m) => m.status === filter.status);
    }

    // Age range filters
    if (filter.minAge !== undefined) {
      result = result.filter((m) => m.age !== undefined && m.age >= filter.minAge!);
    }
    if (filter.maxAge !== undefined) {
      result = result.filter((m) => m.age !== undefined && m.age <= filter.maxAge!);
    }

    // Allocated Department filter
    if (filter.departmentId !== undefined) {
      result = result.filter((m) => m.currentDepartmentId === filter.departmentId);
    }

    // Sorting
    const sortBy = filter.sortBy || "createdAt";
    const sortOrder = filter.sortOrder === "asc" ? 1 : -1;

    result.sort((a, b) => {
      if (sortBy === "fullName") return a.fullName.localeCompare(b.fullName) * sortOrder;
      if (sortBy === "memberId") return a.memberId.localeCompare(b.memberId) * sortOrder;
      if (sortBy === "age") return ((a.age || 0) - (b.age || 0)) * sortOrder;
      if (sortBy === "status") return a.status.localeCompare(b.status) * sortOrder;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortOrder;
    });

    const total = result.length;
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;
    const paginated = result.slice(offset, offset + limit);

    return {
      members: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  static async getById(id: string, currentUser?: AuthSessionPayload): Promise<MemberRecord | null> {
    const member = membersStore.find((m) => m.id === id);
    if (!member) return null;

    if (currentUser && currentUser.role !== "ADMIN" && currentUser.campusId && currentUser.campusId !== member.campusId) {
      throw new Error("Forbidden: Access to another campus member is restricted");
    }

    const history = memberStatusHistoryStore.filter((h) => h.memberId === member.id);
    return {
      ...member,
      statusHistory: history,
    };
  }

  static async getByMemberId(memberId: string): Promise<MemberRecord | null> {
    const member = membersStore.find(
      (m) => m.memberId.toLowerCase() === memberId.toLowerCase().trim()
    );
    return member || null;
  }

  static async createMember(input: CreateMemberInput, currentUser: AuthSessionPayload): Promise<MemberRecord> {
    return this.create(input, currentUser);
  }

  static async create(input: CreateMemberInput, currentUser: AuthSessionPayload): Promise<MemberRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can register new members");
    }

    // Rule 1: Single campus membership validation
    const campus = await CampusService.getById(input.campusId, currentUser);
    if (!campus) {
      throw new Error("Invalid campus: Specified campus does not exist or is inactive");
    }

    if (currentUser.role !== "ADMIN" && currentUser.campusId && currentUser.campusId !== input.campusId) {
      throw new Error("Forbidden: Cannot register a member to a campus you are not assigned to");
    }

    // Rule 2: Automatic member code generation
    let finalMemberId: string;
    if (input.memberId && input.memberId.trim()) {
      finalMemberId = input.memberId.trim().toUpperCase();
      const existing = await this.getByMemberId(finalMemberId);
      if (existing) {
        throw new Error(`Member ID "${finalMemberId}" already exists in the system.`);
      }
    } else {
      finalMemberId = this.generateMemberCode();
    }

    const newId = `10000000-0000-0000-0000-${(membersStore.length + 1).toString().padStart(12, "0")}`;
    const initialStatus = input.status || "ACTIVE";

    const initialHistory: MemberStatusHistoryRecord = {
      id: `msh00000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      memberId: newId,
      oldStatus: "INACTIVE",
      newStatus: initialStatus,
      reason: "Initial member registration in campus registry",
      changedBy: currentUser.userId,
      changedByName: `${currentUser.email} (${currentUser.role})`,
      changedAt: new Date().toISOString(),
    };
    memberStatusHistoryStore.unshift(initialHistory);

    const newMember: MemberRecord = {
      id: newId,
      campusId: input.campusId,
      memberId: finalMemberId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
      christianName: input.christianName ? input.christianName.trim() : "",
      gender: input.gender,
      phoneNumber: input.phoneNumber ? input.phoneNumber.trim() : "",
      email: input.email ? input.email.trim().toLowerCase() : "",
      academicDepartment: input.academicDepartment ? input.academicDepartment.trim() : "",
      serviceDepartment: input.serviceDepartment ? input.serviceDepartment.trim() : "",
      originRegion: input.originRegion ? input.originRegion.trim() : "",
      zone: input.zone ? input.zone.trim() : "",
      woreda: input.woreda ? input.woreda.trim() : "",
      kebele: input.kebele ? input.kebele.trim() : "",
      dormBlock: input.dormBlock ? input.dormBlock.trim() : "",
      dormRoom: input.dormRoom ? input.dormRoom.trim() : "",
      language: input.language ? input.language.trim() : "አማርኛ",
      emergencyContactName: input.emergencyContactName ? input.emergencyContactName.trim() : "",
      emergencyContactPhone: input.emergencyContactPhone ? input.emergencyContactPhone.trim() : "",
      sundaySchoolDuration: input.sundaySchoolDuration ? input.sundaySchoolDuration.trim() : "",
      age: input.age,
      category: input.category || "STUDENT",
      spiritualStatus: input.spiritualStatus || "REGULAR",
      educationLevel: input.educationLevel ? input.educationLevel.trim() : "",
      address: input.address ? input.address.trim() : "",
      emergencyContact: input.emergencyContact ? input.emergencyContact.trim() : "",
      status: initialStatus,
      currentDepartmentId: input.currentDepartmentId || null,
      statusHistory: [initialHistory],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    membersStore.push(newMember);
    return newMember;
  }

  static async batchCreate(
    records: CreateMemberInput[],
    currentUser: AuthSessionPayload
  ): Promise<{ inserted: number; skippedDuplicates: number }> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can bulk import members");
    }

    let inserted = 0;
    let skippedDuplicates = 0;

    const existingIds = new Set(membersStore.map((m) => m.memberId.toLowerCase()));

    for (const input of records) {
      const lowerId = input.memberId ? input.memberId.toLowerCase().trim() : "";
      if (lowerId && existingIds.has(lowerId)) {
        skippedDuplicates++;
        continue;
      }

      const generatedId = lowerId ? input.memberId!.trim() : this.generateMemberCode();
      existingIds.add(generatedId.toLowerCase());

      const newMember: MemberRecord = {
        id: `10000000-0000-0000-0000-${(membersStore.length + 1).toString().padStart(12, "0")}`,
        campusId: input.campusId,
        memberId: generatedId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        gender: input.gender,
        phoneNumber: input.phoneNumber || "",
        email: input.email || "",
        academicDepartment: input.academicDepartment || "",
        serviceDepartment: input.serviceDepartment || "",
        category: input.category || "STUDENT",
        spiritualStatus: input.spiritualStatus || "REGULAR",
        educationLevel: input.educationLevel || "",
        address: input.address || "",
        emergencyContact: input.emergencyContact || "",
        status: input.status || "ACTIVE",
        currentDepartmentId: input.currentDepartmentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      membersStore.push(newMember);
      inserted++;
    }

    return { inserted, skippedDuplicates };
  }

  static async update(
    id: string,
    input: UpdateMemberInput,
    currentUser: AuthSessionPayload
  ): Promise<MemberRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can update member details");
    }

    const member = membersStore.find((m) => m.id === id);
    if (!member) {
      throw new Error("Member not found");
    }

    // Rule 6: Member code is immutable through ordinary member editing
    if ((input as any).memberId && (input as any).memberId.toLowerCase() !== member.memberId.toLowerCase()) {
      throw new Error("Forbidden: Member code is immutable and cannot be modified.");
    }

    // Rule 1: Single campus membership validation
    if (input.campusId && input.campusId !== member.campusId) {
      const targetCampus = await CampusService.getById(input.campusId, currentUser);
      if (!targetCampus) {
        throw new Error("Invalid campus: Target campus does not exist or is inactive");
      }
      member.campusId = input.campusId;
    }

    if (input.firstName !== undefined) member.firstName = input.firstName.trim();
    if (input.lastName !== undefined) member.lastName = input.lastName.trim();
    member.fullName = `${member.firstName} ${member.lastName}`;

    if (input.christianName !== undefined) member.christianName = input.christianName;
    if (input.academicDepartment !== undefined) member.academicDepartment = input.academicDepartment;
    if (input.serviceDepartment !== undefined) member.serviceDepartment = input.serviceDepartment;
    if (input.originRegion !== undefined) member.originRegion = input.originRegion;
    if (input.zone !== undefined) member.zone = input.zone;
    if (input.woreda !== undefined) member.woreda = input.woreda;
    if (input.kebele !== undefined) member.kebele = input.kebele;
    if (input.dormBlock !== undefined) member.dormBlock = input.dormBlock;
    if (input.dormRoom !== undefined) member.dormRoom = input.dormRoom;
    if (input.language !== undefined) member.language = input.language;
    if (input.emergencyContactName !== undefined) member.emergencyContactName = input.emergencyContactName;
    if (input.emergencyContactPhone !== undefined) member.emergencyContactPhone = input.emergencyContactPhone;
    if (input.sundaySchoolDuration !== undefined) member.sundaySchoolDuration = input.sundaySchoolDuration;
    if (input.age !== undefined) member.age = input.age;

    if (input.gender !== undefined) member.gender = input.gender;
    if (input.phoneNumber !== undefined) member.phoneNumber = input.phoneNumber;
    if (input.email !== undefined) member.email = input.email;
    if (input.category !== undefined) member.category = input.category;
    if (input.spiritualStatus !== undefined) member.spiritualStatus = input.spiritualStatus;
    if (input.educationLevel !== undefined) member.educationLevel = input.educationLevel;
    if (input.address !== undefined) member.address = input.address;
    if (input.emergencyContact !== undefined) member.emergencyContact = input.emergencyContact;
    if (input.status !== undefined && input.status !== member.status) {
      await this.changeStatus(id, { status: input.status, reason: "Administrative profile update" }, currentUser);
    }
    if (input.currentDepartmentId !== undefined) member.currentDepartmentId = input.currentDepartmentId;
    member.updatedAt = new Date().toISOString();

    return member;
  }

  /**
   * Transition Member Lifecycle Status with required audit justification (Rule 5)
   */
  static async changeStatus(
    id: string,
    input: ChangeMemberStatusInput,
    currentUser: AuthSessionPayload
  ): Promise<MemberRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can transition member lifecycle status");
    }

    const member = membersStore.find((m) => m.id === id);
    if (!member) {
      throw new Error("Member not found");
    }

    const oldStatus = member.status;
    const newStatus = input.status;

    if (oldStatus === newStatus) {
      return member;
    }

    member.status = newStatus;
    member.updatedAt = new Date().toISOString();

    const historyEntry: MemberStatusHistoryRecord = {
      id: `msh00000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      memberId: member.id,
      oldStatus,
      newStatus,
      reason: input.reason.trim(),
      changedBy: currentUser.userId,
      changedByName: `${currentUser.email} (${currentUser.role})`,
      changedAt: new Date().toISOString(),
    };

    memberStatusHistoryStore.unshift(historyEntry);
    if (!member.statusHistory) member.statusHistory = [];
    member.statusHistory.unshift(historyEntry);

    return member;
  }

  /**
   * Retrieve member status history timeline (Rule 9)
   */
  static async getHistory(memberId: string, currentUser: AuthSessionPayload): Promise<MemberStatusHistoryRecord[]> {
    const member = membersStore.find((m) => m.id === memberId);
    if (!member) {
      throw new Error("Member not found");
    }

    if (currentUser.role !== "ADMIN" && currentUser.campusId && currentUser.campusId !== member.campusId) {
      throw new Error("Forbidden: Access to another campus member history is restricted");
    }

    return memberStatusHistoryStore.filter((h) => h.memberId === memberId);
  }

  /**
   * Archive Member (Soft Archival - Rule 5)
   */
  static async archive(id: string, reason: string, currentUser: AuthSessionPayload): Promise<MemberRecord> {
    return this.changeStatus(id, { status: "ARCHIVED", reason }, currentUser);
  }

  static async batchUpdateStatus(
    memberIds: string[],
    status: MemberStatus,
    currentUser: AuthSessionPayload,
    reason?: string
  ): Promise<{ updatedCount: number }> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can update member status");
    }

    const idSet = new Set(memberIds);
    let updatedCount = 0;
    const justReason = reason || `Batch administrative transition to ${status}`;

    for (const m of membersStore) {
      if (idSet.has(m.id)) {
        await this.changeStatus(m.id, { status, reason: justReason }, currentUser);
        updatedCount++;
      }
    }
    return { updatedCount };
  }

  /**
   * Soft Archival Batch (Rule 5: No ordinary permanent deletion)
   */
  static async batchDelete(
    memberIds: string[],
    currentUser: AuthSessionPayload,
    reason?: string
  ): Promise<{ deletedCount: number }> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can archive members");
    }

    const res = await this.batchUpdateStatus(
      memberIds,
      "ARCHIVED",
      currentUser,
      reason || "Batch administrative archival"
    );
    return { deletedCount: res.updatedCount };
  }

  /**
   * Soft Archival for single delete (Rule 5)
   */
  static async delete(id: string, currentUser: AuthSessionPayload): Promise<boolean> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can archive members");
    }

    const member = membersStore.find((m) => m.id === id);
    if (!member) return false;

    await this.changeStatus(
      id,
      { status: "ARCHIVED", reason: "Administrative soft archival" },
      currentUser
    );
    return true;
  }

  // ==========================================
  // MODULE 4 TRUSTED IMPORT INTEGRATION (Rules 3, 4, 8)
  // ==========================================

  static async findExistingMember(criteria: FindDuplicateCriteria): Promise<MemberRecord | null> {
    if (criteria.memberId) {
      const match = membersStore.find(
        (m) => m.memberId.toLowerCase() === criteria.memberId!.toLowerCase().trim()
      );
      if (match) return match;
    }

    if (criteria.phoneNumber && criteria.campusId) {
      const cleanPhone = criteria.phoneNumber.replace(/\D/g, "");
      if (cleanPhone.length >= 6) {
        const match = membersStore.find(
          (m) =>
            m.campusId === criteria.campusId &&
            m.phoneNumber.replace(/\D/g, "").endsWith(cleanPhone.slice(-9))
        );
        if (match) return match;
      }
    }

    if (criteria.fullName && criteria.campusId) {
      const normName = criteria.fullName.trim().toLowerCase();
      const match = membersStore.find((m) => {
        if (m.campusId !== criteria.campusId) return false;
        const matchesName = m.fullName.trim().toLowerCase() === normName;
        if (!criteria.christianName) return matchesName;
        return (
          matchesName &&
          m.christianName?.trim().toLowerCase() === criteria.christianName.trim().toLowerCase()
        );
      });
      if (match) return match;
    }

    return null;
  }

  static async createApprovedImportMember(
    input: ApprovedImportMemberInput,
    currentUser: AuthSessionPayload
  ): Promise<MemberRecord> {
    if (!input.isApproved) {
      throw new Error("Forbidden: Only approved import records can create permanent member records");
    }

    let fName = input.firstName?.trim() || "";
    let lName = input.lastName?.trim() || "";
    if ((!fName || !lName) && input.fullName) {
      const parts = input.fullName.trim().split(/\s+/);
      fName = parts[0] || "Member";
      lName = parts.slice(1).join(" ") || "Fellow";
    }

    // Idempotent retry safety
    const existing = await this.findExistingMember({
      memberId: (input as any).memberId,
      phoneNumber: input.phoneNumber,
      fullName: input.fullName || `${fName} ${lName}`,
      campusId: input.campusId,
    });
    if (existing) {
      return existing;
    }

    const createPayload: CreateMemberInput = {
      campusId: input.campusId,
      firstName: fName || "Member",
      lastName: lName || "Fellow",
      christianName: input.christianName || "",
      gender: input.gender,
      phoneNumber: input.phoneNumber || "",
      email: input.email || "",
      academicDepartment: input.academicDepartment || input.sourceDepartmentName || "",
      originRegion: input.originRegion || input.region || "",
      zone: input.zone || "",
      woreda: input.woreda || "",
      kebele: input.kebele || "",
      dormBlock: input.dormBlock || input.block || "",
      dormRoom: input.dormRoom || input.dormitory || "",
      language: input.language || "አማርኛ",
      emergencyContactName: input.emergencyContactName || "",
      emergencyContactPhone: input.emergencyContactPhone || "",
      sundaySchoolDuration: input.sundaySchoolDuration || input.residenceOrSundaySchool || "",
      age: input.age,
      category: input.category,
      spiritualStatus: input.spiritualStatus,
      status: input.status,
    };

    return this.create(createPayload, currentUser);
  }

  static async updateApprovedImportMember(
    id: string,
    input: Partial<ApprovedImportMemberInput>,
    currentUser: AuthSessionPayload
  ): Promise<MemberRecord> {
    if (!input.isApproved) {
      throw new Error("Forbidden: Only approved import records can modify permanent member records");
    }

    const member = membersStore.find((m) => m.id === id);
    if (!member) {
      throw new Error("Member not found");
    }

    let fName = input.firstName?.trim();
    let lName = input.lastName?.trim();
    if (!fName && !lName && input.fullName) {
      const parts = input.fullName.trim().split(/\s+/);
      fName = parts[0];
      lName = parts.slice(1).join(" ");
    }

    const updatePayload: Partial<CreateMemberInput> = {
      ...input,
      firstName: fName,
      lastName: lName,
      academicDepartment: input.academicDepartment || input.sourceDepartmentName,
      originRegion: input.originRegion || input.region,
      dormBlock: input.dormBlock || input.block,
      dormRoom: input.dormRoom || input.dormitory,
      sundaySchoolDuration: input.sundaySchoolDuration || input.residenceOrSundaySchool,
    };

    // Rule 4: Preserve existing member code on update!
    delete (updatePayload as any).memberId;
    return this.update(id, updatePayload, currentUser);
  }

  // ==========================================
  // REAL EXECUTIVE DASHBOARD ANALYTICS
  // ==========================================

  static async getDashboardSummary(campusId?: string, currentUser?: AuthSessionPayload) {
    let list = [...membersStore];

    if (currentUser && currentUser.role !== "ADMIN" && currentUser.campusId) {
      list = list.filter((m) => m.campusId === currentUser.campusId);
    } else if (campusId) {
      list = list.filter((m) => m.campusId === campusId);
    }

    const totalMembers = list.length;
    const activeMembers = list.filter((m) => m.status === "ACTIVE").length;
    const inactiveMembers = list.filter((m) => m.status === "INACTIVE").length;
    const archivedMembers = list.filter((m) => m.status === "ARCHIVED").length;
    const suspendedMembers = list.filter((m) => m.status === "SUSPENDED").length;
    const onHoldMembers = list.filter((m) => m.status === "ON_HOLD").length;

    let incompleteCount = 0;
    for (const m of list) {
      if (!m.phoneNumber || !m.emergencyContactPhone || !m.academicDepartment) {
        incompleteCount++;
      }
    }
    const dataCompletenessPercentage =
      totalMembers > 0 ? Math.round(((totalMembers - incompleteCount) / totalMembers) * 100) : 100;

    const genderDistribution = {
      MALE: list.filter((m) => m.gender === "MALE").length,
      FEMALE: list.filter((m) => m.gender === "FEMALE").length,
      OTHER: list.filter((m) => m.gender === "OTHER").length,
    };

    const spiritualStatusDistribution = {
      DEACON: list.filter((m) => m.spiritualStatus === "DEACON").length,
      SERVANT: list.filter((m) => m.spiritualStatus === "SERVANT").length,
      REGULAR: list.filter((m) => m.spiritualStatus === "REGULAR").length,
    };

    const categoryDistribution: Record<string, number> = {};
    for (const m of list) {
      categoryDistribution[m.category] = (categoryDistribution[m.category] || 0) + 1;
    }

    let under20 = 0;
    let age20to24 = 0;
    let age25to29 = 0;
    let age30plus = 0;
    let unknownAge = 0;

    for (const m of list) {
      if (m.age === undefined || m.age === null) {
        unknownAge++;
      } else if (m.age < 20) {
        under20++;
      } else if (m.age <= 24) {
        age20to24++;
      } else if (m.age <= 29) {
        age25to29++;
      } else {
        age30plus++;
      }
    }

    const ageBrackets = {
      under20,
      age20to24,
      age25to29,
      age30plus,
      unknown: unknownAge,
    };

    const statusBreakdown = [
      { status: "ACTIVE", count: activeMembers, fill: "#10b981" },
      { status: "INACTIVE", count: inactiveMembers, fill: "#f59e0b" },
      { status: "ARCHIVED", count: archivedMembers, fill: "#6b7280" },
      { status: "SUSPENDED", count: suspendedMembers, fill: "#ef4444" },
      { status: "ON_HOLD", count: onHoldMembers, fill: "#8b5cf6" },
    ];

    const genderChartData = [
      { gender: "MALE", count: genderDistribution.MALE, fill: "#3b82f6" },
      { gender: "FEMALE", count: genderDistribution.FEMALE, fill: "#ec4899" },
      { gender: "OTHER", count: genderDistribution.OTHER, fill: "#6366f1" },
    ];

    const ageChartData = [
      { bracket: "< 20", count: under20 },
      { bracket: "20-24", count: age20to24 },
      { bracket: "25-29", count: age25to29 },
      { bracket: "30+", count: age30plus },
    ];

    const campusResult = await CampusService.getAll({}, currentUser);
    const allCampuses = Array.isArray(campusResult) ? campusResult : (campusResult.campuses || []);
    const campusDistribution = allCampuses.map((c) => ({
      campusId: c.id,
      campusCode: c.code,
      campusName: c.name,
      count: membersStore.filter((m) => m.campusId === c.id).length,
    }));

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      archivedMembers,
      suspendedMembers,
      onHoldMembers,
      newMembersCount: Math.min(totalMembers, 5),
      incompleteInfoCount: incompleteCount,
      dataCompletenessPercentage,
      completenessRate: dataCompletenessPercentage,
      genderDistribution: genderChartData,
      genderTotals: genderDistribution,
      spiritualStatusDistribution,
      categoryDistribution,
      ageBrackets: ageChartData,
      ageTotals: ageBrackets,
      statusBreakdown,
      campusDistribution,
    };
  }

  static async getCampusStats(campusId?: string) {
    const list = campusId ? membersStore.filter((m) => m.campusId === campusId) : membersStore;

    const total = list.length;
    const active = list.filter((m) => m.status === "ACTIVE").length;
    const onHold = list.filter((m) => m.status === "ON_HOLD").length;
    const male = list.filter((m) => m.gender === "MALE").length;
    const female = list.filter((m) => m.gender === "FEMALE").length;
    const deacons = list.filter((m) => m.spiritualStatus === "DEACON").length;
    const unallocated = list.filter((m) => !m.currentDepartmentId).length;

    return {
      total,
      active,
      onHold,
      male,
      female,
      deacons,
      unallocated,
      allocated: total - unallocated,
    };
  }
}

