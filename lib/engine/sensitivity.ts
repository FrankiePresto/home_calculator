/**
 * Sensitivity analysis for the Home Purchase Analyzer
 *
 * Analyzes how changes in key variables affect the breakeven point
 * and net worth outcomes.
 */

import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
  LifeEvent,
  SensitivityResult,
  SensitivityScenario,
} from './types';

import { projectRentScenario, projectBuyScenario } from './projection';
import { findTimeBreakeven } from './breakeven';

/**
 * Run sensitivity analysis on a single variable
 */
function analyzeVariable(
  profile: FinancialProfile,
  rentScenario: RentScenario,
  buyScenario: BuyScenario,
  lifeEvents: LifeEvent[],
  timeframeYears: number,
  variableName: string,
  variableKey: string,
  baseValue: number,
  changes: number[]
): SensitivityResult {
  const scenarios: SensitivityScenario[] = [];

  // Get base case results
  const baseRent = projectRentScenario(profile, rentScenario, lifeEvents, timeframeYears);
  const baseBuy = projectBuyScenario(profile, buyScenario, lifeEvents, timeframeYears);
  const baseNetWorthDiff =
    baseBuy.snapshots[timeframeYears].netWorth -
    baseRent.snapshots[timeframeYears].netWorth;

  for (const change of changes) {
    const newValue = baseValue + change;

    // Create modified scenarios based on which variable we're testing
    let modifiedProfile = { ...profile };
    let modifiedRentScenario = { ...rentScenario };
    let modifiedBuyScenario = { ...buyScenario };

    switch (variableKey) {
      case 'interestRate':
        modifiedBuyScenario.interestRate = newValue;
        break;
      case 'annualAppreciation':
        modifiedBuyScenario.annualAppreciation = newValue;
        break;
      case 'annualRentIncrease':
        modifiedRentScenario.annualRentIncrease = newValue;
        break;
      case 'expectedInvestmentReturn':
        modifiedProfile.expectedInvestmentReturn = newValue;
        break;
      case 'downPaymentPercent':
        modifiedBuyScenario.downPaymentPercent = Math.max(5, Math.min(100, newValue));
        break;
      case 'savingsRate':
        modifiedProfile.savingsRate = Math.max(0, Math.min(100, newValue));
        break;
    }

    // Run projections with modified values
    const rentResult = projectRentScenario(
      modifiedProfile,
      modifiedRentScenario,
      lifeEvents,
      timeframeYears
    );
    const buyResult = projectBuyScenario(
      modifiedProfile,
      modifiedBuyScenario,
      lifeEvents,
      timeframeYears
    );

    // Find breakeven
    const breakeven = findTimeBreakeven(rentResult.snapshots, buyResult.snapshots);

    // Calculate net worth difference vs base case
    const netWorthDiff =
      buyResult.snapshots[timeframeYears].netWorth -
      rentResult.snapshots[timeframeYears].netWorth;

    scenarios.push({
      change,
      newValue,
      breakevenYear: breakeven?.exact ?? null,
      netWorthDelta: netWorthDiff - baseNetWorthDiff,
    });
  }

  return {
    variable: variableName,
    baseValue,
    scenarios,
  };
}

/**
 * Run comprehensive sensitivity analysis on all key variables
 *
 * @param profile - Financial profile
 * @param rentScenario - Rent scenario
 * @param buyScenario - Buy scenario
 * @param lifeEvents - Life events
 * @param timeframeYears - Analysis timeframe
 * @param changeRange - Percentage points to vary (default: [-2, -1, 0, 1, 2])
 * @returns Array of sensitivity results for each variable
 */
export function runSensitivityAnalysis(
  profile: FinancialProfile,
  rentScenario: RentScenario,
  buyScenario: BuyScenario,
  lifeEvents: LifeEvent[],
  timeframeYears: number,
  changeRange: number[] = [-2, -1, 0, 1, 2]
): SensitivityResult[] {
  const variables = [
    {
      name: 'Mortgage Rate',
      key: 'interestRate',
      baseValue: buyScenario.interestRate,
    },
    {
      name: 'Home Appreciation',
      key: 'annualAppreciation',
      baseValue: buyScenario.annualAppreciation,
    },
    {
      name: 'Rent Increase',
      key: 'annualRentIncrease',
      baseValue: rentScenario.annualRentIncrease,
    },
    {
      name: 'Investment Return',
      key: 'expectedInvestmentReturn',
      baseValue: profile.expectedInvestmentReturn,
    },
  ];

  return variables.map((variable) =>
    analyzeVariable(
      profile,
      rentScenario,
      buyScenario,
      lifeEvents,
      timeframeYears,
      variable.name,
      variable.key,
      variable.baseValue,
      changeRange
    )
  );
}

/**
 * Get the most impactful variable from sensitivity analysis
 *
 * @param results - Sensitivity analysis results
 * @returns The variable with the highest impact on breakeven
 */
export function getMostImpactfulVariable(
  results: SensitivityResult[]
): SensitivityResult | null {
  if (results.length === 0) return null;

  // Calculate the range of breakeven years for each variable
  return results.reduce((mostImpactful, current) => {
    const currentRange = calculateBreakevenRange(current);
    const maxRange = calculateBreakevenRange(mostImpactful);

    return currentRange > maxRange ? current : mostImpactful;
  });
}

/**
 * Calculate the range of breakeven years across scenarios
 */
function calculateBreakevenRange(result: SensitivityResult): number {
  const validBreakevens = result.scenarios
    .map((s) => s.breakevenYear)
    .filter((y): y is number => y !== null);

  if (validBreakevens.length < 2) return 0;

  const min = Math.min(...validBreakevens);
  const max = Math.max(...validBreakevens);

  return max - min;
}

/**
 * Format sensitivity results for tornado chart display
 *
 * @param results - Sensitivity analysis results
 * @returns Formatted data for visualization
 */
export function formatForTornadoChart(
  results: SensitivityResult[]
): Array<{
  variable: string;
  negativeImpact: number;
  positiveImpact: number;
  baseBreakeven: number | null;
}> {
  return results.map((result) => {
    const baseScenario = result.scenarios.find((s) => s.change === 0);
    const minScenario = result.scenarios.find((s) => s.change === Math.min(...result.scenarios.map(s => s.change)));
    const maxScenario = result.scenarios.find((s) => s.change === Math.max(...result.scenarios.map(s => s.change)));

    const baseBreakeven = baseScenario?.breakevenYear ?? null;
    const minBreakeven = minScenario?.breakevenYear ?? baseBreakeven;
    const maxBreakeven = maxScenario?.breakevenYear ?? baseBreakeven;

    // Calculate impact relative to base case
    const negativeImpact = baseBreakeven !== null && minBreakeven !== null
      ? minBreakeven - baseBreakeven
      : 0;
    const positiveImpact = baseBreakeven !== null && maxBreakeven !== null
      ? maxBreakeven - baseBreakeven
      : 0;

    return {
      variable: result.variable,
      negativeImpact,
      positiveImpact,
      baseBreakeven,
    };
  });
}
