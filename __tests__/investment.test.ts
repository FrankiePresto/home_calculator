/**
 * Investment calculation tests
 *
 * These tests verify compound growth calculations for investment portfolios
 */

import {
  growPortfolio,
  calculateFutureValue,
  calculateFutureValueWithContributions,
  calculateYearlyGrowth,
  calculateOpportunityCost,
  monthlyToAnnualReturn,
  annualToMonthlyReturn,
} from '../lib/engine/investment';

describe('growPortfolio', () => {
  it('grows portfolio with monthly contributions over 1 year', () => {
    // $100,000 starting, $500/month, 7% annual return
    const result = growPortfolio(100000, 500, 7, 12);

    // Should be > starting + contributions due to compound growth
    const contributions = 500 * 12;
    expect(result).toBeGreaterThan(100000 + contributions);
    // Approximately $113,461 based on monthly compounding
    expect(result).toBeCloseTo(113461, -2);
  });

  it('grows portfolio with zero contributions', () => {
    // $100,000 at 7% for 1 year
    const result = growPortfolio(100000, 0, 7, 12);

    // Should be approximately $107,229 with monthly compounding
    expect(result).toBeCloseTo(107229, -1);
  });

  it('handles zero starting balance with contributions', () => {
    // $0 starting, $1000/month, 7% for 1 year
    const result = growPortfolio(0, 1000, 7, 12);

    // Should be > $12,000 (pure contributions)
    expect(result).toBeGreaterThan(12000);
    expect(result).toBeCloseTo(12500, -2);
  });

  it('handles zero interest rate', () => {
    // $50,000 starting, $500/month, 0% for 1 year
    const result = growPortfolio(50000, 500, 0, 12);

    // Should be exactly starting + contributions
    expect(result).toBe(50000 + 500 * 12);
  });

  it('handles negative returns', () => {
    // $100,000 at -5% for 1 year
    const result = growPortfolio(100000, 0, -5, 12);

    // Should lose approximately 5% (actually a bit less due to compounding)
    expect(result).toBeLessThan(100000);
    expect(result).toBeCloseTo(95113, -1);
  });

  it('grows over multiple years', () => {
    // $100,000 at 7% for 10 years (120 months)
    const result = growPortfolio(100000, 0, 7, 120);

    // Should approximately double
    expect(result).toBeCloseTo(200966, -1);
  });

  it('handles high contribution rate', () => {
    // $0 starting, $5000/month, 7% for 30 years
    const result = growPortfolio(0, 5000, 7, 360);

    // Should be substantial - approximately $6.1M
    expect(result).toBeGreaterThan(5000000);
  });
});

describe('calculateFutureValue', () => {
  it('calculates simple compound growth', () => {
    // $10,000 at 7% for 10 years
    const result = calculateFutureValue(10000, 7, 10);

    // Should be $19,671.51
    expect(result).toBeCloseTo(19671.51, 0);
  });

  it('handles zero years', () => {
    const result = calculateFutureValue(10000, 7, 0);
    expect(result).toBe(10000);
  });

  it('handles zero principal', () => {
    const result = calculateFutureValue(0, 7, 10);
    expect(result).toBe(0);
  });

  it('handles negative years', () => {
    const result = calculateFutureValue(10000, 7, -5);
    expect(result).toBe(10000);
  });

  it('calculates correctly for 30 years', () => {
    // $100,000 at 7% for 30 years
    const result = calculateFutureValue(100000, 7, 30);

    // Should be approximately $761,225
    expect(result).toBeCloseTo(761225, -2);
  });
});

describe('calculateFutureValueWithContributions', () => {
  it('matches growPortfolio for same inputs', () => {
    const result1 = calculateFutureValueWithContributions(100000, 500, 7, 10);
    const result2 = growPortfolio(100000, 500, 7, 120);

    expect(result1).toBeCloseTo(result2, 0);
  });

  it('calculates correctly for retirement savings', () => {
    // $50,000 starting, $1,000/month, 7% for 30 years
    const result = calculateFutureValueWithContributions(50000, 1000, 7, 30);

    // Should be approximately $1.6M
    expect(result).toBeGreaterThan(1500000);
  });
});

describe('calculateYearlyGrowth', () => {
  it('returns only the growth portion', () => {
    const growth = calculateYearlyGrowth(100000, 0, 7);

    // Should be approximately $7,229 (7% with monthly compounding)
    expect(growth).toBeCloseTo(7229, -1);
  });

  it('excludes contributions from growth calculation', () => {
    const growth = calculateYearlyGrowth(100000, 1000, 7);

    // Growth should be based on growing balance, not just starting
    expect(growth).toBeGreaterThan(7229); // More than pure starting balance growth
  });

  it('handles zero starting balance', () => {
    const growth = calculateYearlyGrowth(0, 1000, 7);

    // Growth on contributions only
    expect(growth).toBeGreaterThan(0);
    expect(growth).toBeLessThan(1000);
  });

  it('handles zero return', () => {
    const growth = calculateYearlyGrowth(100000, 1000, 0);
    expect(growth).toBe(0);
  });
});

describe('calculateOpportunityCost', () => {
  it('calculates foregone growth', () => {
    // $80,000 withdrawal, 7% return, 10 years
    const cost = calculateOpportunityCost(80000, 7, 10);

    // Should be the difference between future value and withdrawal
    expect(cost).toBeCloseTo(157369 - 80000, -2);
  });

  it('increases with longer timeframes', () => {
    const cost10 = calculateOpportunityCost(50000, 7, 10);
    const cost20 = calculateOpportunityCost(50000, 7, 20);
    const cost30 = calculateOpportunityCost(50000, 7, 30);

    expect(cost20).toBeGreaterThan(cost10);
    expect(cost30).toBeGreaterThan(cost20);
  });

  it('returns zero for zero years', () => {
    const cost = calculateOpportunityCost(50000, 7, 0);
    expect(cost).toBe(0);
  });
});

describe('monthlyToAnnualReturn', () => {
  it('converts monthly to annual rate', () => {
    // 0.5654% monthly ≈ 7% annual (with compounding)
    const annual = monthlyToAnnualReturn(0.5654);
    expect(annual).toBeCloseTo(7, 1);
  });

  it('handles zero rate', () => {
    expect(monthlyToAnnualReturn(0)).toBe(0);
  });

  it('handles 1% monthly', () => {
    // 1% monthly = ~12.68% annual
    const annual = monthlyToAnnualReturn(1);
    expect(annual).toBeCloseTo(12.68, 1);
  });
});

describe('annualToMonthlyReturn', () => {
  it('converts annual to monthly rate', () => {
    // 7% annual ≈ 0.5654% monthly
    const monthly = annualToMonthlyReturn(7);
    expect(monthly).toBeCloseTo(0.5654, 3);
  });

  it('handles zero rate', () => {
    expect(annualToMonthlyReturn(0)).toBe(0);
  });

  it('round trip conversion is accurate', () => {
    const annual = 8;
    const monthly = annualToMonthlyReturn(annual);
    const backToAnnual = monthlyToAnnualReturn(monthly);
    expect(backToAnnual).toBeCloseTo(annual, 10);
  });
});
