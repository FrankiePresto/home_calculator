/**
 * Mortgage calculations for the Home Purchase Analyzer
 *
 * Standard mortgage payment formula (NEVER DEVIATE):
 * M = P × [i(1 + i)^n] / [(1 + i)^n - 1]
 * Where:
 *   M = Monthly payment
 *   P = Principal (loan amount)
 *   i = Monthly interest rate (annual rate / 12)
 *   n = Total number of payments (years × 12)
 */

import { AmortizationPayment, YearlyAmortization, MortgageAcceleration } from './types';

/**
 * Calculate the monthly mortgage payment for a given loan
 *
 * @param principal - Loan amount in dollars
 * @param annualRate - Annual interest rate as percentage (e.g., 5 for 5%)
 * @param amortizationYears - Loan term in years
 * @returns Monthly payment amount
 */
export function calculateMonthlyMortgagePayment(
  principal: number,
  annualRate: number,
  amortizationYears: number
): number {
  if (principal <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = amortizationYears * 12;

  // Handle edge case of 0% interest
  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  // Standard mortgage formula
  const payment =
    principal *
    ((monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1));

  return payment;
}

/**
 * Calculate the interest and principal portions of a single monthly payment
 *
 * @param balance - Current loan balance
 * @param annualRate - Annual interest rate as percentage
 * @param monthlyPayment - Fixed monthly payment amount
 * @returns Object with interest and principal portions
 */
export function calculatePaymentBreakdown(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): { interest: number; principal: number } {
  if (balance <= 0) {
    return { interest: 0, principal: 0 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const interest = balance * monthlyRate;
  const principal = Math.min(monthlyPayment - interest, balance);

  return { interest, principal: Math.max(0, principal) };
}

/**
 * Generate a full amortization schedule for a mortgage
 *
 * @param principal - Initial loan amount
 * @param annualRate - Annual interest rate as percentage
 * @param amortizationYears - Loan term in years
 * @returns Array of monthly payment breakdowns
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  amortizationYears: number
): AmortizationPayment[] {
  const schedule: AmortizationPayment[] = [];
  const monthlyPayment = calculateMonthlyMortgagePayment(
    principal,
    annualRate,
    amortizationYears
  );
  const numPayments = amortizationYears * 12;

  let balance = principal;

  for (let month = 1; month <= numPayments && balance > 0; month++) {
    const { interest, principal: principalPaid } = calculatePaymentBreakdown(
      balance,
      annualRate,
      monthlyPayment
    );

    // Handle final payment rounding
    const actualPrincipal = Math.min(principalPaid, balance);
    const actualPayment = interest + actualPrincipal;

    balance = Math.max(0, balance - actualPrincipal);

    schedule.push({
      month,
      payment: actualPayment,
      principal: actualPrincipal,
      interest,
      balance,
    });
  }

  return schedule;
}

/**
 * Calculate total interest and principal paid over a full year of payments
 *
 * @param startingBalance - Balance at beginning of year
 * @param annualRate - Annual interest rate as percentage
 * @param monthlyPayment - Fixed monthly payment amount
 * @returns Object with yearly totals and ending balance
 */
export function amortizeYear(
  startingBalance: number,
  annualRate: number,
  monthlyPayment: number
): YearlyAmortization & { interest: number; principal: number } {
  let balance = startingBalance;
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalPayment = 0;

  for (let month = 1; month <= 12 && balance > 0; month++) {
    const { interest, principal } = calculatePaymentBreakdown(
      balance,
      annualRate,
      monthlyPayment
    );

    const actualPrincipal = Math.min(principal, balance);
    totalInterest += interest;
    totalPrincipal += actualPrincipal;
    totalPayment += interest + actualPrincipal;
    balance = Math.max(0, balance - actualPrincipal);
  }

  return {
    year: 0, // Will be set by caller
    totalPayment,
    totalPrincipal,
    totalInterest,
    endingBalance: balance,
    // Legacy property names for compatibility
    interest: totalInterest,
    principal: totalPrincipal,
  };
}

/**
 * Calculate the total loan amount including mortgage insurance
 *
 * @param purchasePrice - Home purchase price
 * @param downPaymentPercent - Down payment as percentage (e.g., 20 for 20%)
 * @param mortgageInsurancePercent - Insurance premium as percentage of loan (e.g., 2.5)
 * @returns Total loan amount including insurance
 */
export function calculateTotalLoan(
  purchasePrice: number,
  downPaymentPercent: number,
  mortgageInsurancePercent: number
): number {
  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPayment;
  const mortgageInsurance = loanAmount * (mortgageInsurancePercent / 100);

  return loanAmount + mortgageInsurance;
}

/**
 * Calculate closing costs based on purchase price
 *
 * @param purchasePrice - Home purchase price
 * @param closingCostPercent - Closing costs as percentage (optional)
 * @param closingCostFlat - Flat closing cost amount (optional)
 * @returns Total closing costs
 */
export function calculateClosingCosts(
  purchasePrice: number,
  closingCostPercent?: number,
  closingCostFlat?: number
): number {
  if (closingCostFlat !== undefined && closingCostFlat > 0) {
    return closingCostFlat;
  }

  const percent = closingCostPercent ?? 3; // Default 3%
  return purchasePrice * (percent / 100);
}

/**
 * Get the remaining amortization period at a given year
 *
 * @param originalAmortization - Original loan term in years
 * @param currentYear - Current year in the simulation (1-based)
 * @returns Remaining years on the mortgage
 */
export function getRemainingAmortization(
  originalAmortization: number,
  currentYear: number
): number {
  return Math.max(0, originalAmortization - currentYear + 1);
}

// =============================================================================
// Mortgage Acceleration Helpers
// =============================================================================

/**
 * Build a per-year lump sum map from MortgageAcceleration settings.
 * Combines annual lump sums and periodic one-time payments.
 */
export function buildLumpSumMap(
  acceleration: MortgageAcceleration,
  amortizationYears: number
): Map<number, number> {
  const map = new Map<number, number>();

  if (acceleration.annualLumpSum > 0) {
    const end = acceleration.annualLumpSumEndYear ?? amortizationYears;
    for (let y = acceleration.annualLumpSumStartYear; y <= end; y++) {
      map.set(y, (map.get(y) || 0) + acceleration.annualLumpSum);
    }
  }

  for (const p of acceleration.periodicPayments) {
    if (p.amount > 0 && p.year >= 1 && p.year <= amortizationYears) {
      map.set(p.year, (map.get(p.year) || 0) + p.amount);
    }
  }

  return map;
}

/**
 * Amortize one year of a mortgage with extra payments.
 * Returns the same shape as amortizeYear plus extraPrincipal tracking
 * and the lump sum amount actually applied.
 */
export function amortizeYearWithAcceleration(
  startingBalance: number,
  annualRate: number,
  baseMonthlyPayment: number,
  extraMonthlyPayment: number,
  yearEndLumpSum: number
): YearlyAmortization & {
  interest: number;
  principal: number;
  extraPrincipal: number;
  lumpSumApplied: number;
} {
  let balance = startingBalance;
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalPayment = 0;
  let basePrincipal = 0;
  const monthlyRate = annualRate / 100 / 12;

  for (let month = 1; month <= 12 && balance > 0; month++) {
    const interest = balance * monthlyRate;

    // Base payment principal
    const basePayment = Math.min(baseMonthlyPayment, balance + interest);
    const basePrinPaid = Math.max(0, Math.min(basePayment - interest, balance));

    // Extra payment principal
    const remainingAfterBase = balance - basePrinPaid;
    const extraPrinPaid = Math.min(extraMonthlyPayment, remainingAfterBase);

    totalInterest += interest;
    totalPrincipal += basePrinPaid + extraPrinPaid;
    basePrincipal += basePrinPaid;
    totalPayment += interest + basePrinPaid + extraPrinPaid;
    balance = Math.max(0, balance - basePrinPaid - extraPrinPaid);
  }

  // Apply year-end lump sum
  const lumpSumApplied = Math.min(yearEndLumpSum, balance);
  balance = Math.max(0, balance - lumpSumApplied);
  totalPrincipal += lumpSumApplied;
  totalPayment += lumpSumApplied;

  const extraPrincipal = totalPrincipal - basePrincipal;

  return {
    year: 0,
    totalPayment,
    totalPrincipal,
    totalInterest,
    endingBalance: balance,
    interest: totalInterest,
    principal: totalPrincipal,
    extraPrincipal,
    lumpSumApplied,
  };
}

// =============================================================================
// Mortgage Acceleration Simulation
// =============================================================================

export interface MortgageYearlySnapshot {
  year: number;
  balance: number;
  cumulativeInterest: number;
}

export interface MortgageComparisonResult {
  base: MortgageYearlySnapshot[];
  accelerated: MortgageYearlySnapshot[];
  baseTotalInterest: number;
  acceleratedTotalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  acceleratedPayoffMonth: number;
}

/**
 * Simulate base and accelerated mortgage schedules for comparison.
 *
 * Extra monthly payments are applied every month on top of the required payment.
 * Lump sums (provided as pre-aggregated per-year totals) are applied at the end
 * of each applicable year, after that year's monthly payments.
 *
 * The caller is responsible for computing lumpSumsPerYear from whatever rule
 * representation makes sense at the UI layer.
 */
export function simulateMortgageWithExtraPayments(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  extraMonthlyPayment: number = 0,
  lumpSumsPerYear: Array<{ year: number; amount: number }> = []
): MortgageComparisonResult {
  if (principal <= 0) {
    const empty: MortgageYearlySnapshot[] = [{ year: 0, balance: 0, cumulativeInterest: 0 }];
    return { base: empty, accelerated: empty, baseTotalInterest: 0, acceleratedTotalInterest: 0, interestSaved: 0, monthsSaved: 0, acceleratedPayoffMonth: 0 };
  }

  const baseMonthlyPayment = calculateMonthlyMortgagePayment(principal, annualRate, amortizationYears);
  const monthlyRate = annualRate / 100 / 12;

  const lumpSumMap = new Map<number, number>();
  for (const ls of lumpSumsPerYear) {
    if (ls.year > 0 && ls.amount > 0) {
      lumpSumMap.set(ls.year, (lumpSumMap.get(ls.year) || 0) + ls.amount);
    }
  }

  // Base schedule — required payment only
  const base: MortgageYearlySnapshot[] = [{ year: 0, balance: principal, cumulativeInterest: 0 }];
  let baseBalance = principal;
  let baseCumInterest = 0;

  for (let year = 1; year <= amortizationYears; year++) {
    for (let m = 0; m < 12 && baseBalance > 0; m++) {
      const interest = baseBalance * monthlyRate;
      const principalPaid = Math.min(Math.max(0, baseMonthlyPayment - interest), baseBalance);
      baseCumInterest += interest;
      baseBalance = Math.max(0, baseBalance - principalPaid);
    }
    base.push({ year, balance: baseBalance, cumulativeInterest: baseCumInterest });
  }

  // Accelerated schedule — extra monthly + annual lump sums
  const accelerated: MortgageYearlySnapshot[] = [{ year: 0, balance: principal, cumulativeInterest: 0 }];
  let accBalance = principal;
  let accCumInterest = 0;
  let accPayoffMonth = amortizationYears * 12;
  let paidOff = false;

  for (let year = 1; year <= amortizationYears && !paidOff; year++) {
    for (let m = 0; m < 12; m++) {
      if (accBalance <= 0) { paidOff = true; break; }
      const interest = accBalance * monthlyRate;
      // Cap total payment so we never overpay on the final month
      const totalPayment = Math.min(baseMonthlyPayment + extraMonthlyPayment, accBalance + interest);
      const principalPaid = Math.max(0, totalPayment - interest);
      accCumInterest += interest;
      accBalance = Math.max(0, accBalance - principalPaid);
      if (accBalance === 0) {
        accPayoffMonth = (year - 1) * 12 + m + 1;
        paidOff = true;
        break;
      }
    }

    if (!paidOff && accBalance > 0) {
      const lumpSum = lumpSumMap.get(year) || 0;
      if (lumpSum > 0) {
        accBalance = Math.max(0, accBalance - lumpSum);
        if (accBalance === 0) {
          accPayoffMonth = year * 12;
          paidOff = true;
        }
      }
    }

    accelerated.push({ year, balance: accBalance, cumulativeInterest: accCumInterest });
    if (paidOff) break;
  }

  // Pad to full amortization length so both arrays align for charting
  const lastAccYear = accelerated[accelerated.length - 1].year;
  for (let year = lastAccYear + 1; year <= amortizationYears; year++) {
    accelerated.push({ year, balance: 0, cumulativeInterest: accCumInterest });
  }

  return {
    base,
    accelerated,
    baseTotalInterest: baseCumInterest,
    acceleratedTotalInterest: accCumInterest,
    interestSaved: Math.max(0, baseCumInterest - accCumInterest),
    monthsSaved: Math.max(0, amortizationYears * 12 - accPayoffMonth),
    acceleratedPayoffMonth: accPayoffMonth,
  };
}

/**
 * Get the interest rate for a specific year (handles renewal assumptions)
 * This is a simplified model - in reality, renewal rates would vary
 *
 * @param currentRate - Current mortgage interest rate
 * @param renewalRate - Rate assumed at renewal (optional)
 * @param year - Current year in simulation
 * @param termYears - Mortgage term length (typically 5 years in Canada)
 * @returns Interest rate to use for this year
 */
export function getRateForYear(
  currentRate: number,
  renewalRate?: number,
  year: number = 1,
  termYears: number = 5
): number {
  // If no renewal rate specified, use current rate throughout
  if (renewalRate === undefined) {
    return currentRate;
  }

  // After first term, use renewal rate
  return year > termYears ? renewalRate : currentRate;
}
