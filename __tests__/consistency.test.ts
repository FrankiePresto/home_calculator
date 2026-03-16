/**
 * Consistency tests — integration-level checks that different parts
 * of the engine agree with each other.
 */

import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
} from '../lib/engine/types';

import {
  projectRentScenario,
  projectBuyScenario,
} from '../lib/engine/projection';

import {
  calculateBreakeven,
  determineWinner,
  getMilestoneComparisons,
  findAllCrossovers,
} from '../lib/engine/breakeven';

import {
  findRentBreakeven,
} from '../lib/engine/breakeven';

// Shared fixtures
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

const baseRent: RentScenario = {
  monthlyRent: 2500,
  annualRentIncrease: 3,
  rentersInsurance: 30,
};

const baseBuy: BuyScenario = {
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

describe('winner consistency', () => {
  it('winner at final year matches determineWinner', () => {
    const timeframe = 20;
    const rentResult = projectRentScenario(baseProfile, baseRent, [], timeframe);
    const buyResult = projectBuyScenario(baseProfile, baseBuy, [], timeframe);

    const { winner } = determineWinner(rentResult.snapshots, buyResult.snapshots, timeframe);

    const rentFinal = rentResult.snapshots[timeframe].netWorth;
    const buyFinal = buyResult.snapshots[timeframe].netWorth;
    const diff = Math.abs(rentFinal - buyFinal);

    if (diff < 100) {
      expect(winner).toBe('tie');
    } else if (rentFinal > buyFinal) {
      expect(winner).toBe('rent');
    } else {
      expect(winner).toBe('buy');
    }
  });

  it('when winner=rent and breakeven exists, secondCrossover must exist', () => {
    const timeframe = 25;
    const rentResult = projectRentScenario(baseProfile, baseRent, [], timeframe);
    const buyResult = projectBuyScenario(baseProfile, baseBuy, [], timeframe);
    const breakeven = calculateBreakeven(baseProfile, baseRent, baseBuy, [], timeframe);

    const rentFinal = rentResult.snapshots[timeframe].netWorth;
    const buyFinal = buyResult.snapshots[timeframe].netWorth;
    const winner = rentFinal > buyFinal ? 'rent' : 'buy';

    if (winner === 'rent' && breakeven.timeBreakeven) {
      // If rent wins overall but buy overtook rent at some point,
      // the trajectories must have crossed back — secondCrossover must exist
      expect(breakeven.secondCrossover).not.toBeNull();
    }
  });

  it('milestone at final year agrees with overall winner', () => {
    const timeframe = 15;
    const rentResult = projectRentScenario(baseProfile, baseRent, [], timeframe);
    const buyResult = projectBuyScenario(baseProfile, baseBuy, [], timeframe);

    const milestones = getMilestoneComparisons(
      rentResult.snapshots,
      buyResult.snapshots,
      [timeframe]
    );

    const { winner } = determineWinner(rentResult.snapshots, buyResult.snapshots, timeframe);

    expect(milestones.length).toBe(1);
    expect(milestones[0].winner).toBe(winner);
  });
});

describe('equivalent rent consistency', () => {
  it('equivalent rent produces equal net worth at target year (within tolerance)', () => {
    const timeframe = 15;
    const equivalentRent = findRentBreakeven(baseProfile, baseBuy, [], timeframe, 3);

    if (equivalentRent) {
      const eqRentScenario: RentScenario = {
        monthlyRent: equivalentRent,
        annualRentIncrease: 3,
        rentersInsurance: 30,
      };

      const rentResult = projectRentScenario(baseProfile, eqRentScenario, [], timeframe);
      const buyResult = projectBuyScenario(baseProfile, baseBuy, [], timeframe);

      const rentNW = rentResult.snapshots[timeframe].netWorth;
      const buyNW = buyResult.snapshots[timeframe].netWorth;

      // Binary search tolerance is $10/month, so net worth may differ
      // but should be reasonably close
      expect(Math.abs(rentNW - buyNW)).toBeLessThan(5000);
    }
  });
});

describe('crossover and milestone consistency', () => {
  it('milestone winners are consistent with crossover points', () => {
    const timeframe = 30;
    const rentResult = projectRentScenario(baseProfile, baseRent, [], timeframe);
    const buyResult = projectBuyScenario(baseProfile, baseBuy, [], timeframe);

    const crossovers = findAllCrossovers(rentResult.snapshots, buyResult.snapshots);
    const milestones = getMilestoneComparisons(
      rentResult.snapshots,
      buyResult.snapshots,
      [5, 10, 15, 20, 25, 30].filter(y => y <= timeframe)
    );

    for (const m of milestones) {
      if (m.winner === 'tie') continue;

      // Count how many crossovers occurred before this milestone year
      const crossoversBefore = crossovers.filter(c => c.exact < m.year).length;

      // If even number of crossovers before, rent should be ahead (rent starts ahead at year 0)
      // If odd number, buy should be ahead
      const expectedWinner = crossoversBefore % 2 === 0 ? 'rent' : 'buy';
      expect(m.winner).toBe(expectedWinner);
    }
  });
});
