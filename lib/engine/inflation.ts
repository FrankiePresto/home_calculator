/**
 * Inflation adjustment utilities for the Home Purchase Analyzer
 *
 * The engine always computes in nominal dollars (with inflation-grown costs).
 * These utilities deflate nominal values back to "today's dollars" for display.
 */

import {
  YearlySnapshot,
  ProjectionResult,
  CashFlowBreakdown,
} from './types';

/**
 * Calculate the deflation factor for a given year
 * deflator = (1 + rate)^year
 */
export function getDeflator(year: number, inflationRate: number): number {
  if (inflationRate === 0 || year === 0) return 1;
  return Math.pow(1 + inflationRate / 100, year);
}

/**
 * Deflate a single nominal value to real (today's) dollars
 */
export function deflateValue(nominal: number, year: number, inflationRate: number): number {
  return nominal / getDeflator(year, inflationRate);
}

/**
 * Deflate all monetary fields in a cash flow breakdown
 */
function deflateCashFlow(cashFlow: CashFlowBreakdown, deflator: number): CashFlowBreakdown {
  return {
    income: cashFlow.income / deflator,
    toRent: cashFlow.toRent / deflator,
    toMortgageInterest: cashFlow.toMortgageInterest / deflator,
    toMortgagePrincipal: cashFlow.toMortgagePrincipal / deflator,
    toPropertyTax: cashFlow.toPropertyTax / deflator,
    toInsurance: cashFlow.toInsurance / deflator,
    toMaintenance: cashFlow.toMaintenance / deflator,
    toStrata: cashFlow.toStrata / deflator,
    toUtilities: cashFlow.toUtilities / deflator,
    toOtherExpenses: cashFlow.toOtherExpenses / deflator,
    toLifeEvents: cashFlow.toLifeEvents / deflator,
    toInvestments: cashFlow.toInvestments / deflator,
  };
}

/**
 * Deflate all monetary fields in a yearly snapshot
 */
export function deflateSnapshot(snapshot: YearlySnapshot, inflationRate: number): YearlySnapshot {
  const deflator = getDeflator(snapshot.year, inflationRate);
  if (deflator === 1) return snapshot;

  return {
    ...snapshot,
    annualIncome: snapshot.annualIncome / deflator,
    annualGrossIncome: snapshot.annualGrossIncome / deflator,
    monthlyHousingCost: snapshot.monthlyHousingCost / deflator,
    monthlyNonHousingExpenses: snapshot.monthlyNonHousingExpenses / deflator,
    monthlyLifeEventAdjustment: snapshot.monthlyLifeEventAdjustment / deflator,
    monthlyDiscretionary: snapshot.monthlyDiscretionary / deflator,
    monthlySavings: snapshot.monthlySavings / deflator,
    investmentPortfolio: snapshot.investmentPortfolio / deflator,
    nonInvestedSavingsBalance: snapshot.nonInvestedSavingsBalance / deflator,
    homeValue: snapshot.homeValue / deflator,
    mortgageBalance: snapshot.mortgageBalance / deflator,
    homeEquity: snapshot.homeEquity / deflator,
    netWorth: snapshot.netWorth / deflator,
    cashFlow: deflateCashFlow(snapshot.cashFlow, deflator),
  };
}

/**
 * Deflate an entire projection result
 */
export function deflateProjection(projection: ProjectionResult, inflationRate: number): ProjectionResult {
  if (inflationRate === 0) return projection;

  return {
    ...projection,
    snapshots: projection.snapshots.map(snap => deflateSnapshot(snap, inflationRate)),
  };
}
