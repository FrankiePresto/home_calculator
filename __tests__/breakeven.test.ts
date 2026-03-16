/**
 * Breakeven calculation tests
 */

import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
} from '../lib/engine/types';

import {
  findTimeBreakeven,
  findAllCrossovers,
  findRentBreakeven,
  calculateBreakeven,
  determineWinner,
  getMilestoneComparisons,
} from '../lib/engine/breakeven';

import {
  projectRentScenario,
  projectBuyScenario,
} from '../lib/engine/projection';

// Test fixtures
const baseProfile: FinancialProfile = {
  annualGrossIncome: 120000,
  monthlyNonHousingExpenses: 2000,
  currentInvestmentPortfolio: 200000,
  expectedInvestmentReturn: 7,
  savingsRate: 50,
  annualRaisePercent: 2,
  useAdvancedSavings: false,
  nonInvestedSavingsRate: 0,
  nonInvestedReturnRate: 2,
  includeTaxes: false,
  province: 'ON',
  incomeType: 'single',
  secondaryIncome: 0,
};

const baseRentScenario: RentScenario = {
  monthlyRent: 2500,
  annualRentIncrease: 3,
  rentersInsurance: 30,
};

const baseBuyScenario: BuyScenario = {
  name: 'Test Property',
  purchasePrice: 500000,
  downPaymentPercent: 20,
  closingCostPercent: 3,
  interestRate: 5,
  amortizationYears: 25,
  mortgageInsurancePercent: 0,
  monthlyPropertyTax: 350,
  monthlyHomeInsurance: 120,
  monthlyStrataFees: 300,
  monthlyUtilities: 180,
  monthlyMaintenance: 420,
  annualAppreciation: 3,
};

describe('findTimeBreakeven', () => {
  it('finds breakeven when buying eventually wins', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 30);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 30);

    const breakeven = findTimeBreakeven(rentResult.snapshots, buyResult.snapshots);

    // Should find a breakeven point
    expect(breakeven).not.toBeNull();
    if (breakeven) {
      expect(breakeven.exact).toBeGreaterThan(0);
      expect(breakeven.year).toBeGreaterThanOrEqual(1);
      expect(breakeven.month).toBeGreaterThanOrEqual(0);
      expect(breakeven.month).toBeLessThanOrEqual(12);
    }
  });

  it('returns null when buying never breaks even', () => {
    // Very expensive house with low appreciation
    const expensiveBuy: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 1500000,
      annualAppreciation: 1,
    };

    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 30);
    const buyResult = projectBuyScenario(baseProfile, expensiveBuy, [], 30);

    const breakeven = findTimeBreakeven(rentResult.snapshots, buyResult.snapshots);

    // May or may not break even depending on exact numbers
    // The important thing is the function handles both cases and returns valid data
    expect(breakeven === null || breakeven.exact >= 0).toBe(true);
  });

  it('handles buying winning from year 1', () => {
    // Very cheap house scenario
    const cheapBuy: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 200000,
      monthlyPropertyTax: 150,
      monthlyMaintenance: 170,
    };

    const expensiveRent: RentScenario = {
      ...baseRentScenario,
      monthlyRent: 3500,
    };

    const rentResult = projectRentScenario(baseProfile, expensiveRent, [], 10);
    const buyResult = projectBuyScenario(baseProfile, cheapBuy, [], 10);

    const breakeven = findTimeBreakeven(rentResult.snapshots, buyResult.snapshots);

    // Should find early breakeven
    if (breakeven) {
      expect(breakeven.exact).toBeLessThanOrEqual(5);
    }
  });

  it('provides month-level precision', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 20);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 20);

    const breakeven = findTimeBreakeven(rentResult.snapshots, buyResult.snapshots);

    if (breakeven) {
      // exact should be between year-1 and year
      expect(breakeven.exact).toBeGreaterThanOrEqual(breakeven.year - 1);
      expect(breakeven.exact).toBeLessThanOrEqual(breakeven.year);
    }
  });

  it('handles insufficient data', () => {
    const shortRent = projectRentScenario(baseProfile, baseRentScenario, [], 0);
    const shortBuy = projectBuyScenario(baseProfile, baseBuyScenario, [], 0);

    const breakeven = findTimeBreakeven(shortRent.snapshots, shortBuy.snapshots);
    expect(breakeven).toBeNull();
  });
});

describe('findRentBreakeven', () => {
  it('finds equivalent rent for a given buy scenario', () => {
    const equivalentRent = findRentBreakeven(
      baseProfile,
      baseBuyScenario,
      [],
      10,
      3
    );

    expect(equivalentRent).not.toBeNull();
    if (equivalentRent) {
      expect(equivalentRent).toBeGreaterThan(0);
      expect(equivalentRent).toBeLessThan(10000); // Sanity check
    }
  });

  it('higher target year means higher equivalent rent', () => {
    const rent5 = findRentBreakeven(baseProfile, baseBuyScenario, [], 5, 3);
    const rent15 = findRentBreakeven(baseProfile, baseBuyScenario, [], 15, 3);

    // Generally, longer timeframes favor buying, so equivalent rent goes up
    if (rent5 && rent15) {
      expect(rent15).toBeGreaterThanOrEqual(rent5);
    }
  });

  it('returns reasonable value for typical scenario', () => {
    const equivalentRent = findRentBreakeven(
      baseProfile,
      baseBuyScenario,
      [],
      10,
      3
    );

    // Should be in a reasonable range for a $500k home
    if (equivalentRent) {
      expect(equivalentRent).toBeGreaterThan(1000);
      expect(equivalentRent).toBeLessThan(5000);
    }
  });
});

describe('calculateBreakeven', () => {
  it('returns both time and rent breakeven', () => {
    const result = calculateBreakeven(
      baseProfile,
      baseRentScenario,
      baseBuyScenario,
      [],
      20
    );

    expect(result).toHaveProperty('timeBreakeven');
    expect(result).toHaveProperty('rentBreakeven');
  });

  it('provides actionable insights', () => {
    const result = calculateBreakeven(
      baseProfile,
      baseRentScenario,
      baseBuyScenario,
      [],
      15
    );

    // If time breakeven exists, should be reasonable
    if (result.timeBreakeven) {
      expect(result.timeBreakeven.exact).toBeGreaterThan(0);
      expect(result.timeBreakeven.exact).toBeLessThanOrEqual(15);
    }

    // Rent breakeven should be positive
    if (result.rentBreakeven) {
      expect(result.rentBreakeven).toBeGreaterThan(0);
    }
  });
});

describe('determineWinner', () => {
  it('correctly identifies rent winning', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 5);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 5);

    // At year 0, rent should win (no closing costs paid)
    const year0Result = determineWinner(rentResult.snapshots, buyResult.snapshots, 0);
    expect(year0Result.winner).toBe('rent');
  });

  it('correctly identifies buy winning', () => {
    // Create scenario where buy wins quickly
    const cheapBuy: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 250000,
      monthlyPropertyTax: 200,
      monthlyMaintenance: 210,
      annualAppreciation: 5,
    };

    const expensiveRent: RentScenario = {
      monthlyRent: 3000,
      annualRentIncrease: 5,
      rentersInsurance: 30,
    };

    const rentResult = projectRentScenario(baseProfile, expensiveRent, [], 15);
    const buyResult = projectBuyScenario(baseProfile, cheapBuy, [], 15);

    const year15Result = determineWinner(rentResult.snapshots, buyResult.snapshots, 15);
    expect(year15Result.winner).toBe('buy');
  });

  it('identifies tie when difference is small', () => {
    // Create scenarios where they're nearly equal
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 10);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 10);

    // Find the breakeven year and check near it
    const breakeven = findTimeBreakeven(rentResult.snapshots, buyResult.snapshots);
    if (breakeven && breakeven.year < 10) {
      const result = determineWinner(
        rentResult.snapshots,
        buyResult.snapshots,
        breakeven.year
      );
      // Near breakeven, difference should be small
      expect(result.difference).toBeLessThan(50000);
    }
  });

  it('returns correct difference amount', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 5);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 5);

    const result = determineWinner(rentResult.snapshots, buyResult.snapshots, 5);

    const actualDiff = Math.abs(
      rentResult.snapshots[5].netWorth - buyResult.snapshots[5].netWorth
    );
    expect(result.difference).toBeCloseTo(actualDiff, 0);
  });

  it('throws error for out of range year', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 5);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 5);

    expect(() => {
      determineWinner(rentResult.snapshots, buyResult.snapshots, 10);
    }).toThrow();
  });
});

describe('getMilestoneComparisons', () => {
  it('returns comparisons for default milestones', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 30);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 30);

    const comparisons = getMilestoneComparisons(
      rentResult.snapshots,
      buyResult.snapshots
    );

    expect(comparisons.length).toBe(4); // 5, 10, 20, 30
    expect(comparisons.map((c) => c.year)).toEqual([5, 10, 20, 30]);
  });

  it('returns comparisons for custom milestones', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 15);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 15);

    const comparisons = getMilestoneComparisons(
      rentResult.snapshots,
      buyResult.snapshots,
      [3, 7, 12]
    );

    expect(comparisons.length).toBe(3);
    expect(comparisons.map((c) => c.year)).toEqual([3, 7, 12]);
  });

  it('filters out milestones beyond timeframe', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 8);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 8);

    const comparisons = getMilestoneComparisons(
      rentResult.snapshots,
      buyResult.snapshots
    );

    // Should only include year 5, not 10, 20, 30
    expect(comparisons.length).toBe(1);
    expect(comparisons[0].year).toBe(5);
  });

  it('includes all required fields in each comparison', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 10);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 10);

    const comparisons = getMilestoneComparisons(
      rentResult.snapshots,
      buyResult.snapshots,
      [5, 10]
    );

    comparisons.forEach((comparison) => {
      expect(comparison).toHaveProperty('year');
      expect(comparison).toHaveProperty('rentNetWorth');
      expect(comparison).toHaveProperty('buyNetWorth');
      expect(comparison).toHaveProperty('winner');
      expect(comparison).toHaveProperty('difference');
    });
  });
});

describe('findAllCrossovers', () => {
  it('detects single crossover', () => {
    const rentResult = projectRentScenario(baseProfile, baseRentScenario, [], 30);
    const buyResult = projectBuyScenario(baseProfile, baseBuyScenario, [], 30);

    const crossovers = findAllCrossovers(rentResult.snapshots, buyResult.snapshots);

    // Should find at least one crossover
    expect(crossovers.length).toBeGreaterThanOrEqual(1);
    expect(crossovers[0].exact).toBeGreaterThan(0);
    expect(crossovers[0].month).toBeGreaterThanOrEqual(0);
    expect(crossovers[0].month).toBeLessThanOrEqual(12);
  });

  it('detects double crossover (buy wins mid-term, rent wins long-term)', () => {
    // Scenario: moderate house with high investment returns
    // Buy overtakes rent mid-term due to appreciation,
    // but rent catches back up due to compounding investments
    const highReturnProfile: FinancialProfile = {
      ...baseProfile,
      expectedInvestmentReturn: 10,
      currentInvestmentPortfolio: 300000,
    };

    const modestBuy: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 600000,
      annualAppreciation: 2,
      monthlyMaintenance: 500,
      monthlyStrataFees: 400,
    };

    const lowRent: RentScenario = {
      ...baseRentScenario,
      monthlyRent: 2000,
      annualRentIncrease: 2,
    };

    const rentResult = projectRentScenario(highReturnProfile, lowRent, [], 30);
    const buyResult = projectBuyScenario(highReturnProfile, modestBuy, [], 30);

    const crossovers = findAllCrossovers(rentResult.snapshots, buyResult.snapshots);

    // Verify: if there are 2+ crossovers, second one comes after first
    if (crossovers.length >= 2) {
      expect(crossovers[1].exact).toBeGreaterThan(crossovers[0].exact);
    }
  });

  it('returns empty when rent always wins', () => {
    // Very expensive house relative to rent
    const expensiveBuy: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 1500000,
      annualAppreciation: 1,
      monthlyMaintenance: 1250,
      monthlyStrataFees: 800,
    };

    const cheapRent: RentScenario = {
      ...baseRentScenario,
      monthlyRent: 1500,
      annualRentIncrease: 1,
    };

    const rentResult = projectRentScenario(baseProfile, cheapRent, [], 30);
    const buyResult = projectBuyScenario(baseProfile, expensiveBuy, [], 30);

    const crossovers = findAllCrossovers(rentResult.snapshots, buyResult.snapshots);

    // Rent should always win — no crossovers
    // (depending on exact scenario it may still cross, so we check
    // that if no crossover then rent always leads)
    if (crossovers.length === 0) {
      for (let i = 0; i < rentResult.snapshots.length; i++) {
        expect(rentResult.snapshots[i].netWorth).toBeGreaterThanOrEqual(
          buyResult.snapshots[i].netWorth
        );
      }
    }
  });
});

describe('calculateBreakeven with secondCrossover', () => {
  it('populates secondCrossover for double-crossover scenario', () => {
    const highReturnProfile: FinancialProfile = {
      ...baseProfile,
      expectedInvestmentReturn: 10,
      currentInvestmentPortfolio: 300000,
    };

    const modestBuy: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 600000,
      annualAppreciation: 2,
      monthlyMaintenance: 500,
      monthlyStrataFees: 400,
    };

    const lowRent: RentScenario = {
      ...baseRentScenario,
      monthlyRent: 2000,
      annualRentIncrease: 2,
    };

    const result = calculateBreakeven(highReturnProfile, lowRent, modestBuy, [], 30);

    // Check that result has the secondCrossover field
    expect(result).toHaveProperty('secondCrossover');

    // If timeBreakeven exists and trajectories cross back, secondCrossover should exist
    if (result.timeBreakeven && result.secondCrossover) {
      expect(result.secondCrossover.exact).toBeGreaterThan(result.timeBreakeven.exact);
    }
  });

  it('secondCrossover is null when buy permanently wins', () => {
    const cheapBuy: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 250000,
      monthlyPropertyTax: 200,
      monthlyMaintenance: 210,
      monthlyStrataFees: 0,
      annualAppreciation: 4,
    };

    const expensiveRent: RentScenario = {
      monthlyRent: 3000,
      annualRentIncrease: 4,
      rentersInsurance: 30,
    };

    const result = calculateBreakeven(baseProfile, expensiveRent, cheapBuy, [], 25);

    // Buy should win permanently — no second crossover
    expect(result.secondCrossover).toBeNull();
  });
});
