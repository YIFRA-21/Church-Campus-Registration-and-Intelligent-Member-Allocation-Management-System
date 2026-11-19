import { DepartmentRecord } from "./department.service";
import { MemberRecord } from "./member.service";
import { EligibilityRuleInput, RuleType } from "../schemas/allocation.schema";
import { AuthSessionPayload } from "../schemas/auth.schema";

export interface EligibilityRuleRecord {
  id: string;
  departmentId: string;
  ruleName: string;
  ruleType: RuleType;
  operator: "EQUALS" | "IN" | "NOT_EQUALS";
  value: string[];
  isMandatory: boolean;
  createdAt: string;
}

// Default standard rules for Main Campus departments
const INITIAL_RULES: EligibilityRuleRecord[] = [
  // CHOIR-01
  {
    id: "r0000000-0000-0000-0000-000000000001",
    departmentId: "d0000000-0000-0000-0000-000000000001",
    ruleName: "Choir Category Criteria",
    ruleType: "CATEGORY",
    operator: "IN",
    value: ["YOUTH", "STUDENT", "ADULT", "YOUNG_ADULT"],
    isMandatory: true,
    createdAt: new Date().toISOString(),
  },
  // TEACH-01 (Spiritual Education requires Deacon or Servant status)
  {
    id: "r0000000-0000-0000-0000-000000000002",
    departmentId: "d0000000-0000-0000-0000-000000000002",
    ruleName: "Teaching Spiritual Qualification",
    ruleType: "SPIRITUAL_STATUS",
    operator: "IN",
    value: ["DEACON", "SERVANT"],
    isMandatory: true,
    createdAt: new Date().toISOString(),
  },
  // PRAY-01 (Open to active members)
  {
    id: "r0000000-0000-0000-0000-000000000003",
    departmentId: "d0000000-0000-0000-0000-000000000003",
    ruleName: "Prayer Active Member Requirement",
    ruleType: "GENDER",
    operator: "IN",
    value: ["MALE", "FEMALE"],
    isMandatory: true,
    createdAt: new Date().toISOString(),
  },
  // EVANG-01
  {
    id: "r0000000-0000-0000-0000-000000000004",
    departmentId: "d0000000-0000-0000-0000-000000000004",
    ruleName: "Evangelism Category Requirement",
    ruleType: "CATEGORY",
    operator: "IN",
    value: ["YOUTH", "STUDENT", "ADULT", "YOUNG_ADULT"],
    isMandatory: true,
    createdAt: new Date().toISOString(),
  },
  // SOC-01
  {
    id: "r0000000-0000-0000-0000-000000000005",
    departmentId: "d0000000-0000-0000-0000-000000000005",
    ruleName: "Social Service Gender Inclusivity",
    ruleType: "GENDER",
    operator: "IN",
    value: ["MALE", "FEMALE"],
    isMandatory: true,
    createdAt: new Date().toISOString(),
  },
];

let rulesStore: EligibilityRuleRecord[] = [...INITIAL_RULES];

export interface MemberEligibilityResult {
  isEligible: boolean;
  eligibleDepartments: DepartmentRecord[];
  ineligibleDetails: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    reasons: string[];
  }[];
}

export class EligibilityService {
  static async getRulesForDepartment(departmentId: string): Promise<EligibilityRuleRecord[]> {
    return rulesStore.filter((r) => r.departmentId === departmentId);
  }

  static async addRule(
    input: EligibilityRuleInput,
    currentUser: AuthSessionPayload
  ): Promise<EligibilityRuleRecord> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can configure eligibility rules");
    }

    const newRule: EligibilityRuleRecord = {
      id: `r0000000-0000-0000-0000-${(rulesStore.length + 1).toString().padStart(12, "0")}`,
      departmentId: input.departmentId,
      ruleName: input.ruleName,
      ruleType: input.ruleType,
      operator: input.operator,
      value: input.value,
      isMandatory: input.isMandatory,
      createdAt: new Date().toISOString(),
    };

    rulesStore.push(newRule);
    return newRule;
  }

  static async deleteRule(id: string, currentUser: AuthSessionPayload): Promise<boolean> {
    if (currentUser.role !== "ADMIN") {
      throw new Error("Forbidden: Only Administrators can remove eligibility rules");
    }

    const initialLen = rulesStore.length;
    rulesStore = rulesStore.filter((r) => r.id !== id);
    return rulesStore.length < initialLen;
  }

  /**
   * Evaluate if a member satisfies all rules of a specific department
   */
  static evaluateDepartmentEligibility(
    member: MemberRecord,
    department: DepartmentRecord
  ): { eligible: boolean; reasons: string[] } {
    const rules = rulesStore.filter((r) => r.departmentId === department.id);
    const reasons: string[] = [];

    for (const rule of rules) {
      if (rule.ruleType === "GENDER") {
        const matches = rule.value.includes(member.gender);
        if (rule.operator === "IN" && !matches) {
          reasons.push(`Gender "${member.gender}" is not eligible. Allowed: ${rule.value.join(", ")}`);
        }
      } else if (rule.ruleType === "CATEGORY") {
        const matches = rule.value.includes(member.category);
        if (rule.operator === "IN" && !matches) {
          reasons.push(
            `Member Category "${member.category}" is not eligible. Allowed: ${rule.value.join(", ")}`
          );
        }
      } else if (rule.ruleType === "SPIRITUAL_STATUS") {
        const matches = rule.value.includes(member.spiritualStatus);
        if (rule.operator === "IN" && !matches) {
          reasons.push(
            `Spiritual Status "${member.spiritualStatus}" is not eligible. Requires: ${rule.value.join(", ")}`
          );
        }
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Evaluates eligibility across all active departments in a campus
   */
  static evaluateAll(
    member: MemberRecord,
    departments: DepartmentRecord[]
  ): MemberEligibilityResult {
    const eligibleDepartments: DepartmentRecord[] = [];
    const ineligibleDetails: MemberEligibilityResult["ineligibleDetails"] = [];

    for (const dept of departments) {
      const evaluation = this.evaluateDepartmentEligibility(member, dept);
      if (evaluation.eligible) {
        eligibleDepartments.push(dept);
      } else {
        ineligibleDetails.push({
          departmentId: dept.id,
          departmentCode: dept.code,
          departmentName: dept.name,
          reasons: evaluation.reasons,
        });
      }
    }

    return {
      isEligible: eligibleDepartments.length > 0,
      eligibleDepartments,
      ineligibleDetails,
    };
  }
}

