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

import { AmortizationPayment, YearlyAmortization } from './types';

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
