import { AllocationMemberCandidate, DepartmentConfig } from "./types";

export function isMemberEligibleForDepartment(
  member: AllocationMemberCandidate,
  dept: DepartmentConfig
): { eligible: boolean; failureReason?: string } {
  // If department has no specific rules, it defaults to accepting all active members
  if (!dept.eligibilityRules || dept.eligibilityRules.length === 0) {
    return { eligible: true };
  }

  // A member is eligible if they satisfy AT LEAST ONE eligibility rule set (or the single active rule)
  // For standard usage, each department has one active rule set
  for (const rule of dept.eligibilityRules) {
    let matchesGender = true;
    let matchesCategory = true;
    let matchesDeacon = true;

    // Gender check
    if (rule.allowedGenders && rule.allowedGenders !== "ALL") {
      matchesGender = member.gender.toUpperCase() === rule.allowedGenders.toUpperCase();
    }

    // Category check
    if (rule.allowedCategories && rule.allowedCategories !== "ALL") {
      try {
        const allowed = JSON.parse(rule.allowedCategories);
        if (Array.isArray(allowed)) {
          matchesCategory = allowed.map((c) => c.toLowerCase()).includes(member.category.toLowerCase());
        }
      } catch {
        // Fallback string matching
        matchesCategory = rule.allowedCategories.toLowerCase().includes(member.category.toLowerCase());
      }
    }

    // Deacon status check
    if (rule.requiresDeacon !== null && rule.requiresDeacon !== undefined) {
      matchesDeacon = member.isDeacon === rule.requiresDeacon;
    }

    if (matchesGender && matchesCategory && matchesDeacon) {
      return { eligible: true };
    }
  }

  return {
    eligible: false,
    failureReason: `Criteria mismatch: Gender (${member.gender}), Category (${member.category}), Deacon (${member.isDeacon ? "Yes" : "No"})`,
  };
}

