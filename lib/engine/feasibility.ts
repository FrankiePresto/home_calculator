/**
 * Financial Feasibility Analysis
 *
 * Checks for potential financial problems in the projections
 * and generates warnings for users.
 */

import {
  YearlySnapshot,
  ProjectionResult,
  FeasibilityWarning,
  FinancialProfile,
  BuyScenario,
} from './types';

// Mortgage stress thresholds (housing cost as % of gross income)
const MORTGAGE_STRESS_WARNING = 0.35; // 35%
const MORTGAGE_STRESS_CRITICAL = 0.44; // 44%

/**
 * Check for negative discretionary income
 */
function checkNegativeDiscretionary(
  snapshot: YearlySnapshot,
  scenario: 'rent' | 'buy'
): FeasibilityWarning | null {
  if (snapshot.monthlyDiscretionary < 0) {
    return {
      type: 'negative_discretionary',
      year: snapshot.year,
      severity: 'critical',
      message: `Year ${snapshot.year}: Monthly expenses exceed income by $${Math.abs(Math.round(snapshot.monthlyDiscretionary))}`,
      scenario,
    };
  }
  return null;
}

/**
 * Check if savings rate target can be achieved
 */
function checkInsufficientSavings(
  snapshot: YearlySnapshot,
  targetSavingsRate: number,
  scenario: 'rent' | 'buy'
): FeasibilityWarning | null {
  if (snapshot.monthlyDiscretionary <= 0) {
    // Already covered by negative_discretionary
    return null;
  }

  const targetMonthlySavings = snapshot.monthlyDiscretionary * (targetSavingsRate / 100);
  const actualSavings = snapshot.monthlySavings;

  // If actual savings is significantly less than target (accounting for rounding)
  if (actualSavings < targetMonthlySavings * 0.95 && targetSavingsRate > 0) {
    return {
      type: 'insufficient_savings',
      year: snapshot.year,
      severity: 'warning',
      message: `Year ${snapshot.year}: Can only save $${Math.round(actualSavings)}/mo instead of target $${Math.round(targetMonthlySavings)}/mo`,
      scenario,
    };
  }
  return null;
}

/**
 * Check for mortgage stress (housing costs > 35% of income)
 */
function checkMortgageStress(
  snapshot: YearlySnapshot,
  scenario: 'rent' | 'buy'
): FeasibilityWarning | null {
  if (snapshot.annualIncome <= 0) return null;

  const monthlyGrossIncome = snapshot.annualIncome / 12;
  const housingRatio = snapshot.monthlyHousingCost / monthlyGrossIncome;

  if (housingRatio >= MORTGAGE_STRESS_CRITICAL) {
    return {
      type: 'mortgage_stress',
      year: snapshot.year,
      severity: 'critical',
      message: `Year ${snapshot.year}: Housing costs are ${Math.round(housingRatio * 100)}% of income (critical threshold: 44%)`,
      scenario,
    };
  } else if (housingRatio >= MORTGAGE_STRESS_WARNING) {
    return {
      type: 'mortgage_stress',
      year: snapshot.year,
      severity: 'warning',
      message: `Year ${snapshot.year}: Housing costs are ${Math.round(housingRatio * 100)}% of income (recommended: <35%)`,
      scenario,
    };
  }
  return null;
}

/**
 * Analyze a projection for feasibility warnings
 */
function analyzeProjection(
  projection: ProjectionResult,
  profile: FinancialProfile
): FeasibilityWarning[] {
  const warnings: FeasibilityWarning[] = [];
  const scenario = projection.scenario;

  // Skip year 0 (initial state)
  for (let i = 1; i < projection.snapshots.length; i++) {
    const snapshot = projection.snapshots[i];

    // Check for negative discretionary income
    const negDiscWarning = checkNegativeDiscretionary(snapshot, scenario);
    if (negDiscWarning) warnings.push(negDiscWarning);

    // Check for insufficient savings (only if no negative discretionary)
    if (!negDiscWarning) {
      const savingsWarning = checkInsufficientSavings(
        snapshot,
        profile.savingsRate,
        scenario
      );
      if (savingsWarning) warnings.push(savingsWarning);
    }

    // Check for mortgage stress
    const stressWarning = checkMortgageStress(snapshot, scenario);
    if (stressWarning) warnings.push(stressWarning);
  }

  return warnings;
}

/**
 * Deduplicate warnings - only keep first occurrence of each type per scenario
 */
function deduplicateWarnings(warnings: FeasibilityWarning[]): FeasibilityWarning[] {
  const seen = new Set<string>();
  const result: FeasibilityWarning[] = [];

  for (const warning of warnings) {
    const key = `${warning.scenario}-${warning.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(warning);
    }
  }

  return result;
}

/**
 * Run full feasibility analysis on rent and buy projections
 */
export function analyzeFeasibility(
  rentProjection: ProjectionResult | null,
  buyProjection: ProjectionResult | null,
  profile: FinancialProfile
): FeasibilityWarning[] {
  const warnings: FeasibilityWarning[] = [];

  if (rentProjection) {
    warnings.push(...analyzeProjection(rentProjection, profile));
  }

  if (buyProjection) {
    warnings.push(...analyzeProjection(buyProjection, profile));
  }

  // Sort by severity (critical first), then by year
  const sorted = warnings.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return a.year - b.year;
  });

  // Deduplicate to show only first occurrence of each warning type
  return deduplicateWarnings(sorted);
}

/**
 * Get summary statistics for feasibility
 */
export function getFeasibilitySummary(warnings: FeasibilityWarning[]): {
  criticalCount: number;
  warningCount: number;
  hasRentIssues: boolean;
  hasBuyIssues: boolean;
} {
  const criticalCount = warnings.filter((w) => w.severity === 'critical').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;
  const hasRentIssues = warnings.some((w) => w.scenario === 'rent');
  const hasBuyIssues = warnings.some((w) => w.scenario === 'buy');

  return { criticalCount, warningCount, hasRentIssues, hasBuyIssues };
}
