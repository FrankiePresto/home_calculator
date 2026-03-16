/**
 * Breakeven calculations for the Home Purchase Analyzer
 *
 * Determines:
 * 1. Time breakeven: When does buying become better than renting?
 * 2. Rent breakeven: What rent makes buying equivalent at a given time?
 */

import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
  LifeEvent,
  YearlySnapshot,
  TimeBreakeven,
  BreakevenResult,
} from './types';

import {
  projectRentScenario,
  projectBuyScenario,
} from './projection';

/**
 * Find the time at which buying breaks even with renting
 *
 * @param rentSnapshots - Yearly snapshots from rent scenario
 * @param buySnapshots - Yearly snapshots from buy scenario
 * @returns Breakeven time info, or null if buying never breaks even
 */
export function findTimeBreakeven(
  rentSnapshots: YearlySnapshot[],
  buySnapshots: YearlySnapshot[]
): TimeBreakeven | null {
  // Need at least 2 years of data
  if (rentSnapshots.length < 2 || buySnapshots.length < 2) {
    return null;
  }

  // Check if buying already wins at Year 1
  if (buySnapshots[1].netWorth >= rentSnapshots[1].netWorth) {
    // Interpolate between Year 0 and Year 1
    const year0Diff = rentSnapshots[0].netWorth - buySnapshots[0].netWorth;
    const year1Diff = rentSnapshots[1].netWorth - buySnapshots[1].netWorth;

    // If renting was already worse at Year 0, buying wins immediately
    if (year0Diff <= 0) {
      return { year: 0, month: 0, exact: 0 };
    }

    const fraction = year0Diff / (year0Diff - year1Diff);
    return {
      year: 1,
      month: Math.round(fraction * 12),
      exact: fraction,
    };
  }

  // Search through subsequent years
  for (let i = 2; i < rentSnapshots.length; i++) {
    if (buySnapshots[i].netWorth >= rentSnapshots[i].netWorth) {
      // Interpolate for month precision
      const prevDiff = rentSnapshots[i - 1].netWorth - buySnapshots[i - 1].netWorth;
      const currDiff = rentSnapshots[i].netWorth - buySnapshots[i].netWorth;

      // Calculate exact fractional year
      const fraction = prevDiff / (prevDiff - currDiff);
      const exactYear = i - 1 + fraction;

      return {
        year: i,
        month: Math.round(fraction * 12),
        exact: exactYear,
      };
    }
  }

  // Buying never breaks even within the timeframe
  return null;
}

/**
 * Find ALL crossover points where buy and rent net worth trajectories cross
 *
 * A crossover occurs when the sign of (rent net worth - buy net worth) changes.
 * Returns them in chronological order.
 *
 * @param rentSnapshots - Yearly snapshots from rent scenario
 * @param buySnapshots - Yearly snapshots from buy scenario
 * @returns Array of crossover points (may be empty)
 */
export function findAllCrossovers(
  rentSnapshots: YearlySnapshot[],
  buySnapshots: YearlySnapshot[]
): TimeBreakeven[] {
  const crossovers: TimeBreakeven[] = [];
  const len = Math.min(rentSnapshots.length, buySnapshots.length);

  if (len < 2) return crossovers;

  for (let i = 1; i < len; i++) {
    const prevDiff = rentSnapshots[i - 1].netWorth - buySnapshots[i - 1].netWorth;
    const currDiff = rentSnapshots[i].netWorth - buySnapshots[i].netWorth;

    // Detect sign change (crossover)
    if ((prevDiff > 0 && currDiff <= 0) || (prevDiff < 0 && currDiff >= 0)) {
      // Interpolate for sub-year precision
      const fraction = Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(currDiff));
      const exactYear = i - 1 + fraction;

      crossovers.push({
        year: i,
        month: Math.round(fraction * 12),
        exact: exactYear,
      });
    }
  }

  return crossovers;
}

/**
 * Find the rent that would make buying and renting equivalent at a target year
 * Uses binary search for efficiency
 *
 * @param profile - Financial profile
 * @param buyScenario - Buy scenario to compare against
 * @param lifeEvents - Life events to apply
 * @param targetYear - Year at which to find equilibrium
 * @param rentIncreasePercent - Annual rent increase rate
 * @param tolerance - Acceptable difference in monthly rent (default $10)
 * @returns Monthly rent that equals buying, or null if not determinable
 */
export function findRentBreakeven(
  profile: FinancialProfile,
  buyScenario: BuyScenario,
  lifeEvents: LifeEvent[],
  targetYear: number,
  rentIncreasePercent: number = 3,
  tolerance: number = 10
): number | null {
  // First, run the buy scenario to get target net worth
  const buyResult = projectBuyScenario(profile, buyScenario, lifeEvents, targetYear);
  const targetNetWorth = buyResult.snapshots[targetYear]?.netWorth;

  if (targetNetWorth === undefined) {
    return null;
  }

  // Binary search for the rent that produces equal net worth
  let low = 0;
  let high = 15000; // Maximum reasonable monthly rent
  let iterations = 0;
  const maxIterations = 50;

  while (high - low > tolerance && iterations < maxIterations) {
    iterations++;
    const mid = (low + high) / 2;

    const testRentScenario: RentScenario = {
      monthlyRent: mid,
      annualRentIncrease: rentIncreasePercent,
      rentersInsurance: 30,
    };

    const rentResult = projectRentScenario(
      profile,
      testRentScenario,
      lifeEvents,
      targetYear
    );
    const rentNetWorth = rentResult.snapshots[targetYear].netWorth;

    if (rentNetWorth > targetNetWorth) {
      // Rent too low - renter has more wealth, so increase rent
      low = mid;
    } else {
      // Rent too high - buyer has more wealth, so decrease rent
      high = mid;
    }
  }

  return Math.round((low + high) / 2);
}

/**
 * Find the purchase price breakeven for a given rent
 * Uses binary search to find the price where buying equals renting
 *
 * @param profile - Financial profile
 * @param rentScenario - Rent scenario to compare against
 * @param baseBuyScenario - Base buy scenario (price will be varied)
 * @param lifeEvents - Life events to apply
 * @param targetYear - Year at which to find equilibrium
 * @param tolerance - Acceptable difference in price (default $5000)
 * @returns Purchase price that equals renting, or null if not determinable
 */
export function findPriceBreakeven(
  profile: FinancialProfile,
  rentScenario: RentScenario,
  baseBuyScenario: BuyScenario,
  lifeEvents: LifeEvent[],
  targetYear: number,
  tolerance: number = 5000
): number | null {
  // First, run the rent scenario to get target net worth
  const rentResult = projectRentScenario(profile, rentScenario, lifeEvents, targetYear);
  const targetNetWorth = rentResult.snapshots[targetYear].netWorth;

  // Binary search for the price that produces equal net worth
  let low = 100000; // Minimum reasonable home price
  let high = 5000000; // Maximum reasonable home price
  let iterations = 0;
  const maxIterations = 50;

  while (high - low > tolerance && iterations < maxIterations) {
    iterations++;
    const mid = (low + high) / 2;

    const testBuyScenario: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: mid,
      // Recalculate maintenance based on new price (1% annually / 12 months)
      monthlyMaintenance: (mid * 0.01) / 12,
    };

    // Check if portfolio can cover down payment + closing costs
    const downPayment = mid * (testBuyScenario.downPaymentPercent / 100);
    const closingCosts = mid * ((testBuyScenario.closingCostPercent ?? 3) / 100);
    if (downPayment + closingCosts > profile.currentInvestmentPortfolio) {
      // Price too high - can't afford
      high = mid;
      continue;
    }

    const buyResult = projectBuyScenario(
      profile,
      testBuyScenario,
      lifeEvents,
      targetYear
    );
    const buyNetWorth = buyResult.snapshots[targetYear].netWorth;

    if (buyNetWorth > targetNetWorth) {
      // Price too low - buying wins, so increase price
      low = mid;
    } else {
      // Price too high - renting wins, so decrease price
      high = mid;
    }
  }

  return Math.round((low + high) / 2);
}

/**
 * Calculate comprehensive breakeven analysis
 *
 * @param profile - Financial profile
 * @param rentScenario - Rent scenario
 * @param buyScenario - Buy scenario
 * @param lifeEvents - Life events
 * @param timeframeYears - Analysis timeframe
 * @returns Complete breakeven results
 */
export function calculateBreakeven(
  profile: FinancialProfile,
  rentScenario: RentScenario,
  buyScenario: BuyScenario,
  lifeEvents: LifeEvent[],
  timeframeYears: number
): BreakevenResult {
  // Run both projections
  const rentResult = projectRentScenario(
    profile,
    rentScenario,
    lifeEvents,
    timeframeYears
  );
  const buyResult = projectBuyScenario(
    profile,
    buyScenario,
    lifeEvents,
    timeframeYears
  );

  // Find all crossover points
  const crossovers = findAllCrossovers(rentResult.snapshots, buyResult.snapshots);
  const timeBreakeven = crossovers[0] ?? null;
  const secondCrossover = crossovers[1] ?? null;

  // Find rent breakeven at the timeframe horizon
  const rentBreakeven = findRentBreakeven(
    profile,
    buyScenario,
    lifeEvents,
    timeframeYears,
    rentScenario.annualRentIncrease
  );

  return {
    timeBreakeven,
    secondCrossover,
    rentBreakeven,
  };
}

/**
 * Determine the winner (rent vs buy) at a specific year
 *
 * @param rentSnapshots - Rent scenario snapshots
 * @param buySnapshots - Buy scenario snapshots
 * @param year - Year to check
 * @returns Object with winner and net worth difference
 */
export function determineWinner(
  rentSnapshots: YearlySnapshot[],
  buySnapshots: YearlySnapshot[],
  year: number
): { winner: 'rent' | 'buy' | 'tie'; difference: number } {
  if (year >= rentSnapshots.length || year >= buySnapshots.length) {
    throw new Error('Year out of range');
  }

  const rentNetWorth = rentSnapshots[year].netWorth;
  const buyNetWorth = buySnapshots[year].netWorth;
  const difference = Math.abs(rentNetWorth - buyNetWorth);

  // Consider a tie if difference is less than $100
  if (difference < 100) {
    return { winner: 'tie', difference: 0 };
  }

  return {
    winner: rentNetWorth > buyNetWorth ? 'rent' : 'buy',
    difference,
  };
}

/**
 * Get net worth comparison at milestone years
 *
 * @param rentSnapshots - Rent scenario snapshots
 * @param buySnapshots - Buy scenario snapshots
 * @param milestones - Years to compare (default: 5, 10, 20, 30)
 * @returns Array of comparisons at each milestone
 */
export function getMilestoneComparisons(
  rentSnapshots: YearlySnapshot[],
  buySnapshots: YearlySnapshot[],
  milestones: number[] = [5, 10, 20, 30]
): Array<{
  year: number;
  rentNetWorth: number;
  buyNetWorth: number;
  winner: 'rent' | 'buy' | 'tie';
  difference: number;
}> {
  return milestones
    .filter(
      (year) => year < rentSnapshots.length && year < buySnapshots.length
    )
    .map((year) => {
      const { winner, difference } = determineWinner(
        rentSnapshots,
        buySnapshots,
        year
      );
      return {
        year,
        rentNetWorth: rentSnapshots[year].netWorth,
        buyNetWorth: buySnapshots[year].netWorth,
        winner,
        difference,
      };
    });
}
