import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_SECRET } from "../config/supabase";
import {
  LoginInput,
  AuthSessionPayload,
  SystemRole,
  UpdateProfileInput,
} from "../schemas/auth.schema";

export const ADMIN_PERMISSIONS = [
  "campus.manage",
  "campus.view",
  "department.manage",
  "department.view",
  "department.target.manage",
  "department.eligibility.manage",
  "member.register",
  "member.import_excel",
  "member.view_all",
  "member.manage",
  "allocation.configure",
  "allocation.run",
  "allocation.review",
  "allocation.override",
  "allocation.approve",
  "evaluation.manage",
  "evaluation.assign",
  "evaluation.review",
  "reports.view",
  "reports.export",
  "audit.view",
  "settings.manage",
  "user.manage",
];

export const EVALUATOR_PERMISSIONS = [
  "evaluation.view_assigned",
  "evaluation.score",
  "evaluation.draft",
  "evaluation.submit",
  "evaluation.history",
  "member.view_assigned",
  "department.view",
  "campus.view",
];

export interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string;
  username: string;
  staffCode: string;
  phoneNumber?: string;
  honorific?: string;
  gender?: string;
  dateOfBirth?: string;
  languages?: string[];
  confessionFather?: string;
  country?: string;
  city?: string;
  subcity?: string;
  woreda?: string;
  houseNumber?: string;
  homeParish?: string;
  specialization?: string;
  panel?: string;
  governanceScope?: string;
  campusId: string | null;
  campusName: string | null;
  role: SystemRole;
  permissions: string[];
}

export const DEMO_USERS: Record<string, DemoUser> = {
  "admin@c-cimas.org": {
    id: "f0000000-0000-0000-0000-000000000001",
    email: "admin@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Rev. Solomon Tadesse (Admin)",
    avatarUrl: "",
    username: "solomon.tadesse",
    staffCode: "ADM-2026-001",
    phoneNumber: "+251 91 100 0001",
    honorific: "Rev. (መጋቤ ሐዲስ)",
    gender: "Male",
    dateOfBirth: "1982-04-12",
    languages: ["Amharic", "Ge'ez", "English"],
    confessionFather: "Abba Gebremedhin (መንበረ ፀባኦት ቅድስት ሥላሴ)",
    country: "Ethiopia",
    city: "Addis Ababa",
    subcity: "Arada Subcity (Arat Kilo)",
    woreda: "Woreda 03",
    houseNumber: "Office #102 / Cathedral Compound",
    homeParish: "Holy Trinity Cathedral (መንበረ ፀባኦት ቅድስት ሥላሴ ካቴድራል)",
    governanceScope: "Supreme Cross-Campus Governance & System Administration",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "ADMIN",
    permissions: ADMIN_PERMISSIONS,
  },
  "evaluator@c-cimas.org": {
    id: "f0000000-0000-0000-0000-000000000002",
    email: "evaluator@c-cimas.org",
    passwordHash: bcrypt.hashSync("admin123", 10),
    fullName: "Dr. Aster Melaku (Evaluator)",
    avatarUrl: "",
    username: "aster.melaku",
    staffCode: "EVL-2026-042",
    phoneNumber: "+251 91 100 0005",
    honorific: "Dr. (ዶ/ር)",
    gender: "Female",
    dateOfBirth: "1988-09-24",
    languages: ["Amharic", "English", "Tigrinya"],
    confessionFather: "Megabe Hadis Eshetu (ደብረ ሰላም መድኃኔዓለም)",
    country: "Ethiopia",
    city: "Addis Ababa",
    subcity: "Bole Subcity",
    woreda: "Woreda 04",
    houseNumber: "House #208 / Ring Road",
    homeParish: "Debre Selam Medhanealem (ደብረ ሰላም መድኃኔዓለም ገዳም)",
    specialization: "Liturgical Chant, Sacred Music & Spiritual Dedication Assessment",
    panel: "Senior Evaluator Board #2 (Ministry Allocation Panel)",
    campusId: "a0000000-0000-0000-0000-000000000001",
    campusName: "Main Campus (Addis Ababa)",
    role: "EVALUATOR",
    permissions: EVALUATOR_PERMISSIONS,
  },
};

export function formatUserProfile(user: DemoUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl || "",
    username: user.username,
    staffCode: user.staffCode,
    phoneNumber: user.phoneNumber || "",
    honorific: user.honorific || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth || "",
    languages: user.languages || ["Amharic"],
    confessionFather: user.confessionFather || "",
    country: user.country || "Ethiopia",
    city: user.city || "Addis Ababa",
    subcity: user.subcity || "",
    woreda: user.woreda || "",
    houseNumber: user.houseNumber || "",
    homeParish: user.homeParish || "",
    specialization: user.specialization,
    panel: user.panel,
    governanceScope: user.governanceScope,
    role: user.role,
    campusId: user.campusId,
    campusName: user.campusName,
    permissions: user.permissions,
  };
}

export class AuthService {
  static async login(input: LoginInput) {
    const user = DEMO_USERS[input.email];

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const payload: AuthSessionPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      campusId: user.campusId,
      role: user.role,
      permissions: user.permissions,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return {
      token,
      user: formatUserProfile(user),
    };
  }

  static getProfileById(userId: string) {
    const found = Object.values(DEMO_USERS).find((u) => u.id === userId);
    if (!found) return null;
    return formatUserProfile(found);
  }

  static updateProfile(userId: string, input: UpdateProfileInput) {
    const user = Object.values(DEMO_USERS).find((u) => u.id === userId);
    if (!user) {
      throw new Error("User account not found");
    }

    if (input.fullName !== undefined) user.fullName = input.fullName;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
    if (input.phoneNumber !== undefined) user.phoneNumber = input.phoneNumber;
    if (input.username !== undefined) user.username = input.username;
    if (input.honorific !== undefined) user.honorific = input.honorific;
    if (input.gender !== undefined) user.gender = input.gender;
    if (input.dateOfBirth !== undefined) user.dateOfBirth = input.dateOfBirth;
    if (input.languages !== undefined) user.languages = input.languages;
    if (input.confessionFather !== undefined) user.confessionFather = input.confessionFather;
    if (input.country !== undefined) user.country = input.country;
    if (input.city !== undefined) user.city = input.city;
    if (input.subcity !== undefined) user.subcity = input.subcity;
    if (input.woreda !== undefined) user.woreda = input.woreda;
    if (input.houseNumber !== undefined) user.houseNumber = input.houseNumber;
    if (input.homeParish !== undefined) user.homeParish = input.homeParish;
    if (input.specialization !== undefined) user.specialization = input.specialization;
    if (input.panel !== undefined) user.panel = input.panel;
    if (input.governanceScope !== undefined) user.governanceScope = input.governanceScope;

    return formatUserProfile(user);
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = Object.values(DEMO_USERS).find((u) => u.id === userId);
    if (!user) {
      throw new Error("User account not found");
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    return {
      success: true,
      message: "Password successfully updated",
    };
  }
}
