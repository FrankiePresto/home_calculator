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
 * Internal warning data with numeric value for aggregation
 */
interface WarningData {
  type: FeasibilityWarning['type'];
  year: number;
  severity: FeasibilityWarning['severity'];
  scenario: 'rent' | 'buy';
  value: number; // Numeric value for range calculation (e.g., percentage, dollar amount)
}

/**
 * Check for negative discretionary income
 */
function checkNegativeDiscretionary(
  snapshot: YearlySnapshot,
  scenario: 'rent' | 'buy'
): WarningData | null {
  if (snapshot.monthlyDiscretionary < 0) {
    return {
      type: 'negative_discretionary',
      year: snapshot.year,
      severity: 'critical',
      scenario,
      value: Math.abs(Math.round(snapshot.monthlyDiscretionary)),
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
): WarningData | null {
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
      scenario,
      value: Math.round(actualSavings),
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
): WarningData | null {
  // Mortgage stress is a gross-income rule (35%/44%); use gross even when taxes are enabled.
  if (snapshot.annualGrossIncome <= 0) return null;

  const monthlyGrossIncome = snapshot.annualGrossIncome / 12;
  const housingRatio = snapshot.monthlyHousingCost / monthlyGrossIncome;

  if (housingRatio >= MORTGAGE_STRESS_CRITICAL) {
    return {
      type: 'mortgage_stress',
      year: snapshot.year,
      severity: 'critical',
      scenario,
      value: Math.round(housingRatio * 100),
    };
  } else if (housingRatio >= MORTGAGE_STRESS_WARNING) {
    return {
      type: 'mortgage_stress',
      year: snapshot.year,
      severity: 'warning',
      scenario,
      value: Math.round(housingRatio * 100),
    };
  }
  return null;
}

/**
 * Aggregate warnings of the same type/scenario into year ranges
 */
function aggregateWarnings(
  warnings: WarningData[],
  totalYears: number
): FeasibilityWarning[] {
  // Group warnings by type, scenario, and severity
  const groups = new Map<string, WarningData[]>();

  for (const warning of warnings) {
    const key = `${warning.scenario}-${warning.type}-${warning.severity}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(warning);
  }

  const aggregated: FeasibilityWarning[] = [];

  groups.forEach((groupWarnings) => {
    if (groupWarnings.length === 0) return;

    // Sort by year
    groupWarnings.sort((a, b) => a.year - b.year);

    const first = groupWarnings[0];
    const years = groupWarnings.map(w => w.year);
    const values = groupWarnings.map(w => w.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Check if years are consecutive
    const isConsecutive = years.every((year, i) =>
      i === 0 || year === years[i - 1] + 1
    );

    // Check if it spans all years
    const spansAllYears = years.length === totalYears &&
      years[0] === 1 &&
      years[years.length - 1] === totalYears;

    // Build year range string
    let yearStr: string;
    let endYear: number | undefined;

    if (spansAllYears) {
      yearStr = 'throughout the analysis period';
    } else if (years.length === 1) {
      yearStr = `Year ${years[0]}`;
    } else if (isConsecutive) {
      yearStr = `Years ${years[0]}-${years[years.length - 1]}`;
      endYear = years[years.length - 1];
    } else {
      // Non-consecutive years - just show range
      yearStr = `Years ${years[0]}-${years[years.length - 1]}`;
      endYear = years[years.length - 1];
    }

    // Build value range string
    const valueRange = minValue === maxValue ? `${minValue}` : `${minValue}-${maxValue}`;

    // Generate message based on type
    let message: string;
    switch (first.type) {
      case 'negative_discretionary':
        if (spansAllYears) {
          message = `Monthly expenses exceed income by $${valueRange} ${yearStr}`;
        } else {
          message = `${yearStr}: Monthly expenses exceed income by $${valueRange}`;
        }
        break;
      case 'insufficient_savings':
        if (spansAllYears) {
          message = `Unable to meet savings target ${yearStr}`;
        } else {
          message = `${yearStr}: Unable to meet savings target`;
        }
        break;
      case 'mortgage_stress':
        const threshold = first.severity === 'critical' ? '44%' : '35%';
        if (spansAllYears) {
          message = `Housing costs are ${valueRange}% of income ${yearStr} (threshold: ${threshold})`;
        } else {
          message = `${yearStr}: Housing costs are ${valueRange}% of income (threshold: ${threshold})`;
        }
        break;
      default:
        message = `${yearStr}: Financial concern detected`;
    }

    aggregated.push({
      type: first.type,
      year: first.year,
      endYear,
      severity: first.severity,
      message,
      scenario: first.scenario,
      valueRange,
    });
  });

  return aggregated;
}

/**
 * Analyze a projection for feasibility warnings
 */
function analyzeProjection(
  projection: ProjectionResult,
  profile: FinancialProfile
): WarningData[] {
  const warnings: WarningData[] = [];
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
 * Run full feasibility analysis on rent and buy projections
 */
export function analyzeFeasibility(
  rentProjection: ProjectionResult | null,
  buyProjection: ProjectionResult | null,
  profile: FinancialProfile
): FeasibilityWarning[] {
  const warningData: WarningData[] = [];

  // Determine total years for "throughout" detection
  const totalYears = Math.max(
    rentProjection ? rentProjection.snapshots.length - 1 : 0,
    buyProjection ? buyProjection.snapshots.length - 1 : 0
  );

  if (rentProjection) {
    warningData.push(...analyzeProjection(rentProjection, profile));
  }

  if (buyProjection) {
    warningData.push(...analyzeProjection(buyProjection, profile));
  }

  // Aggregate warnings into year ranges
  const aggregated = aggregateWarnings(warningData, totalYears);

  // Sort by severity (critical first), then by year
  return aggregated.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return a.year - b.year;
  });
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
