/**
 * Mortgage calculation tests
 *
 * These tests verify the mortgage payment formula and amortization calculations
 * against known values from online calculators and manual calculations.
 */

import {
  calculateMonthlyMortgagePayment,
  calculatePaymentBreakdown,
  generateAmortizationSchedule,
  amortizeYear,
  calculateTotalLoan,
  calculateClosingCosts,
  getRemainingAmortization,
  getRateForYear,
} from '../lib/engine/mortgage';

describe('calculateMonthlyMortgagePayment', () => {
  it('calculates correct payment for standard 30-year mortgage', () => {
    // $400,000 loan at 6% for 30 years = $2,398.20/month
    const payment = calculateMonthlyMortgagePayment(400000, 6, 30);
    expect(payment).toBeCloseTo(2398.20, 0);
  });

  it('calculates correct payment for 25-year mortgage', () => {
    // $400,000 loan at 6% for 25 years = $2,577.09/month
    const payment = calculateMonthlyMortgagePayment(400000, 6, 25);
    expect(payment).toBeCloseTo(2577.09, 0);
  });

  it('calculates correct payment for 15-year mortgage', () => {
    // $400,000 loan at 6% for 15 years = $3,375.43/month
    const payment = calculateMonthlyMortgagePayment(400000, 6, 15);
    expect(payment).toBeCloseTo(3375.43, 0);
  });

  it('calculates correct payment for 5% interest rate', () => {
    // $300,000 loan at 5% for 30 years = $1,610.46/month
    const payment = calculateMonthlyMortgagePayment(300000, 5, 30);
    expect(payment).toBeCloseTo(1610.46, 0);
  });

  it('handles 0% interest rate', () => {
    // $360,000 loan at 0% for 30 years = $1,000/month
    const payment = calculateMonthlyMortgagePayment(360000, 0, 30);
    expect(payment).toBeCloseTo(1000, 2);
  });

  it('handles 0 principal', () => {
    const payment = calculateMonthlyMortgagePayment(0, 6, 30);
    expect(payment).toBe(0);
  });

  it('handles negative principal', () => {
    const payment = calculateMonthlyMortgagePayment(-100000, 6, 30);
    expect(payment).toBe(0);
  });

  it('handles high interest rate', () => {
    // $200,000 loan at 10% for 30 years = $1,755.14/month
    const payment = calculateMonthlyMortgagePayment(200000, 10, 30);
    expect(payment).toBeCloseTo(1755.14, 0);
  });
});

describe('calculatePaymentBreakdown', () => {
  it('calculates correct interest for first payment', () => {
    // $400,000 at 6% = $2,000 interest in first month
    const { interest, principal } = calculatePaymentBreakdown(400000, 6, 2398.20);
    expect(interest).toBeCloseTo(2000, 0);
    expect(principal).toBeCloseTo(398.20, 0);
  });

  it('principal increases as balance decreases', () => {
    const payment = calculateMonthlyMortgagePayment(400000, 6, 30);

    // First month
    const first = calculatePaymentBreakdown(400000, 6, payment);

    // After 10 years (balance around $334,000)
    const midBalance = 334000;
    const mid = calculatePaymentBreakdown(midBalance, 6, payment);

    expect(mid.principal).toBeGreaterThan(first.principal);
    expect(mid.interest).toBeLessThan(first.interest);
  });

  it('handles zero balance', () => {
    const { interest, principal } = calculatePaymentBreakdown(0, 6, 1000);
    expect(interest).toBe(0);
    expect(principal).toBe(0);
  });

  it('limits principal to remaining balance', () => {
    // If balance is less than calculated principal, limit to balance
    const { principal } = calculatePaymentBreakdown(100, 6, 500);
    expect(principal).toBeLessThanOrEqual(100);
  });
});

describe('generateAmortizationSchedule', () => {
  it('generates correct number of payments', () => {
    const schedule = generateAmortizationSchedule(400000, 6, 30);
    expect(schedule.length).toBe(360);
  });

  it('balance reaches zero at end', () => {
    const schedule = generateAmortizationSchedule(400000, 6, 30);
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 0);
  });

  it('total principal paid equals original loan', () => {
    const schedule = generateAmortizationSchedule(400000, 6, 30);
    const totalPrincipal = schedule.reduce((sum, p) => sum + p.principal, 0);
    expect(totalPrincipal).toBeCloseTo(400000, 0);
  });

  it('payments are consistent throughout', () => {
    const schedule = generateAmortizationSchedule(400000, 6, 30);
    const expectedPayment = calculateMonthlyMortgagePayment(400000, 6, 30);

    // Check first 100 payments are consistent (last few may vary due to rounding)
    for (let i = 0; i < 100; i++) {
      expect(schedule[i].payment).toBeCloseTo(expectedPayment, 0);
    }
  });
});

describe('amortizeYear', () => {
  it('calculates yearly totals correctly', () => {
    const monthlyPayment = calculateMonthlyMortgagePayment(400000, 6, 30);
    const yearly = amortizeYear(400000, 6, monthlyPayment);

    // Total payment should be roughly 12x monthly
    expect(yearly.totalPayment).toBeCloseTo(monthlyPayment * 12, 0);

    // Interest + Principal should equal total payment
    expect(yearly.totalInterest + yearly.totalPrincipal).toBeCloseTo(
      yearly.totalPayment,
      0
    );
  });

  it('ending balance is reduced by principal paid', () => {
    const monthlyPayment = calculateMonthlyMortgagePayment(400000, 6, 30);
    const yearly = amortizeYear(400000, 6, monthlyPayment);

    expect(yearly.endingBalance).toBeCloseTo(400000 - yearly.totalPrincipal, 0);
  });

  it('handles partial year when balance goes to zero', () => {
    // Small balance that will be paid off within the year
    const yearly = amortizeYear(5000, 6, 2000);
    expect(yearly.endingBalance).toBe(0);
    expect(yearly.totalPrincipal).toBe(5000);
  });
});

describe('calculateTotalLoan', () => {
  it('calculates loan without mortgage insurance', () => {
    // $500,000 home with 20% down = $400,000 loan
    const loan = calculateTotalLoan(500000, 20, 0);
    expect(loan).toBe(400000);
  });

  it('adds mortgage insurance to loan', () => {
    // $500,000 home with 10% down = $450,000 loan + 2.5% insurance
    const loan = calculateTotalLoan(500000, 10, 2.5);
    expect(loan).toBe(450000 + 450000 * 0.025); // 461,250
  });

  it('handles 5% down payment', () => {
    // $400,000 home with 5% down = $380,000 loan
    const loan = calculateTotalLoan(400000, 5, 0);
    expect(loan).toBe(380000);
  });

  it('handles 100% down payment', () => {
    const loan = calculateTotalLoan(500000, 100, 0);
    expect(loan).toBe(0);
  });
});

describe('calculateClosingCosts', () => {
  it('calculates percentage-based closing costs', () => {
    // 3% of $500,000 = $15,000
    const costs = calculateClosingCosts(500000, 3);
    expect(costs).toBe(15000);
  });

  it('uses flat amount when provided', () => {
    const costs = calculateClosingCosts(500000, 3, 10000);
    expect(costs).toBe(10000);
  });

  it('defaults to 3% when no values provided', () => {
    const costs = calculateClosingCosts(400000);
    expect(costs).toBe(12000);
  });

  it('prefers flat amount over percentage', () => {
    const costs = calculateClosingCosts(500000, 5, 8000);
    expect(costs).toBe(8000);
  });
});

describe('getRemainingAmortization', () => {
  it('returns correct remaining years', () => {
    expect(getRemainingAmortization(25, 1)).toBe(25);
    expect(getRemainingAmortization(25, 5)).toBe(21);
    expect(getRemainingAmortization(25, 25)).toBe(1);
  });

  it('does not go below zero', () => {
    expect(getRemainingAmortization(25, 30)).toBe(0);
  });
});

describe('getRateForYear', () => {
  it('returns current rate before renewal', () => {
    expect(getRateForYear(5, 6, 1)).toBe(5);
    expect(getRateForYear(5, 6, 5)).toBe(5);
  });

  it('returns renewal rate after term', () => {
    expect(getRateForYear(5, 6, 6)).toBe(6);
    expect(getRateForYear(5, 6, 10)).toBe(6);
  });

  it('uses current rate when no renewal rate specified', () => {
    expect(getRateForYear(5, undefined, 10)).toBe(5);
  });

  it('respects custom term length', () => {
    expect(getRateForYear(5, 6, 3, 3)).toBe(5);
    expect(getRateForYear(5, 6, 4, 3)).toBe(6);
  });
});
