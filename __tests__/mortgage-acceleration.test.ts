/**
 * Mortgage acceleration simulation tests
 */

import {
  calculateMonthlyMortgagePayment,
  generateAmortizationSchedule,
  simulateMortgageWithExtraPayments,
} from '../lib/engine/mortgage';

describe('simulateMortgageWithExtraPayments', () => {
  const principal = 400000;
  const rate = 5;
  const years = 25;

  it('base schedule with zero extras matches standard amortization', () => {
    const result = simulateMortgageWithExtraPayments(principal, rate, years, 0, []);
    const schedule = generateAmortizationSchedule(principal, rate, years);

    // Final balance should be ~0
    const baseFinal = result.base[result.base.length - 1];
    expect(baseFinal.balance).toBeCloseTo(0, 0);

    // Total interest should match full amortization schedule
    const scheduleInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
    expect(result.baseTotalInterest).toBeCloseTo(scheduleInterest, 0);

    // No savings when there are no extras
    expect(result.interestSaved).toBeCloseTo(0, 0);
    expect(result.monthsSaved).toBe(0);
  });

  it('extra monthly payment reduces interest and payoff time', () => {
    const extraMonthly = 500;
    const result = simulateMortgageWithExtraPayments(principal, rate, years, extraMonthly, []);

    expect(result.acceleratedTotalInterest).toBeLessThan(result.baseTotalInterest);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.acceleratedPayoffMonth).toBeLessThan(years * 12);
  });

  it('lump sums reduce balance at correct years', () => {
    const lumpSums = [
      { year: 3, amount: 20000 },
      { year: 7, amount: 15000 },
    ];
    const result = simulateMortgageWithExtraPayments(principal, rate, years, 0, lumpSums);

    // Accelerated balance at year 3 should be lower than base by roughly the lump sum
    const baseY3 = result.base[3].balance;
    const accY3 = result.accelerated[3].balance;
    // The difference won't be exactly 20000 because less interest accrues after the lump sum
    // but it should be at least the lump sum amount
    expect(baseY3 - accY3).toBeGreaterThanOrEqual(20000 - 1);

    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.monthsSaved).toBeGreaterThan(0);
  });

  it('combined strategies stack', () => {
    const extraOnly = simulateMortgageWithExtraPayments(principal, rate, years, 300, []);
    const lumpOnly = simulateMortgageWithExtraPayments(principal, rate, years, 0, [
      { year: 5, amount: 25000 },
    ]);
    const combined = simulateMortgageWithExtraPayments(principal, rate, years, 300, [
      { year: 5, amount: 25000 },
    ]);

    // Combined should save more interest than either alone
    expect(combined.interestSaved).toBeGreaterThan(extraOnly.interestSaved);
    expect(combined.interestSaved).toBeGreaterThan(lumpOnly.interestSaved);
  });

  it('large extra payment pays off quickly', () => {
    // Extra payment larger than the base payment itself
    const basePayment = calculateMonthlyMortgagePayment(principal, rate, years);
    const result = simulateMortgageWithExtraPayments(principal, rate, years, basePayment, []);

    // Should pay off in roughly half the time
    expect(result.acceleratedPayoffMonth).toBeLessThan(years * 12 / 2 + 12);
    expect(result.interestSaved).toBeGreaterThan(result.baseTotalInterest * 0.4);
  });

  it('handles zero principal', () => {
    const result = simulateMortgageWithExtraPayments(0, rate, years, 500, []);
    expect(result.base.length).toBe(1);
    expect(result.interestSaved).toBe(0);
  });
});
