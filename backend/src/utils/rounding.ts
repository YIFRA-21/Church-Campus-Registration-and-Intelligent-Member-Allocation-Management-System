/**
 * Largest Remainder Method (Hare-Niemeyer Method)
 * Guarantees that the sum of computed department integer target counts
 * strictly equals the exact campus member population (totalMembers).
 */

export interface DepartmentShareInput {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  percentage: number; // e.g. 30.0 for 30%
}

export interface CalculatedDepartmentTarget {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  percentage: number;
  exactShare: number;
  targetCount: number;
  remainder: number;
}

export function calculateLargestRemainderTargets(
  totalMembers: number,
  departments: DepartmentShareInput[]
): {
  totalAllocatedTarget: number;
  targets: CalculatedDepartmentTarget[];
} {
  if (totalMembers <= 0) {
    return {
      totalAllocatedTarget: 0,
      targets: departments.map((d) => ({
        departmentId: d.departmentId,
        departmentCode: d.departmentCode,
        departmentName: d.departmentName,
        percentage: d.percentage,
        exactShare: 0,
        targetCount: 0,
        remainder: 0,
      })),
    };
  }

  // Verify percentage sum equals 100% (with standard floating-point tolerance of 0.01)
  const sumPercent = departments.reduce((acc, d) => acc + d.percentage, 0);
  const roundedSum = Math.round(sumPercent * 100) / 100;
  if (Math.abs(roundedSum - 100) > 0.01) {
    throw new Error(
      `Department percentage targets must sum to exactly 100%. Current sum: ${roundedSum}%`
    );
  }

  // 1. Calculate raw quota and base integer floor for each department
  let allocatedSum = 0;
  const initialCalculations = departments.map((d) => {
    const exactShare = (totalMembers * d.percentage) / 100;
    const baseTarget = Math.floor(exactShare);
    const remainder = exactShare - baseTarget;
    allocatedSum += baseTarget;

    return {
      departmentId: d.departmentId,
      departmentCode: d.departmentCode,
      departmentName: d.departmentName,
      percentage: d.percentage,
      exactShare,
      targetCount: baseTarget,
      remainder,
    };
  });

  // 2. Determine deficit between totalMembers and sum of integer floors
  let remainingDeficit = totalMembers - allocatedSum;

  // 3. Sort by largest remainder descending (stable tie-breaker by departmentCode)
  const sorted = [...initialCalculations].sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 0.0000001) {
      return b.remainder - a.remainder;
    }
    return a.departmentCode.localeCompare(b.departmentCode);
  });

  // 4. Distribute 1 seat to each department with largest remainder until deficit is 0
  const bonusMap = new Set<string>();
  for (let i = 0; i < remainingDeficit && i < sorted.length; i++) {
    bonusMap.add(sorted[i].departmentId);
  }

  // 5. Build final target list preserving original input order
  const finalTargets = initialCalculations.map((item) => {
    const finalCount = bonusMap.has(item.departmentId) ? item.targetCount + 1 : item.targetCount;
    return {
      ...item,
      targetCount: finalCount,
    };
  });

  const totalCalculated = finalTargets.reduce((sum, t) => sum + t.targetCount, 0);

  return {
    totalAllocatedTarget: totalCalculated,
    targets: finalTargets,
  };
}

