/**
 * Year-by-year projection engine for the Home Purchase Analyzer
 *
 * This is the core simulation engine that models a user's entire financial life
 * across both rent and buy scenarios.
 *
 * CRITICAL: Year 0 represents the initial state immediately after purchase
 * (for buy) or at the start (for rent). The renter's portfolio remains intact
 * while the buyer's is reduced by down payment and closing costs.
 */

import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
  LifeEvent,
  YearlySnapshot,
  ProjectionResult,
  CashFlowBreakdown,
  LifeEventImpact,
} from './types';

import {
  calculateMonthlyMortgagePayment,
  amortizeYear,
  calculateClosingCosts,
  calculateTotalLoan,
  getRateForYear,
  getRemainingAmortization,
} from './mortgage';

import { growPortfolio } from './investment';

/**
 * Process life events for a given year and return their financial impact
 */
export function processLifeEvents(
  events: LifeEvent[],
  currentYear: number,
  currentIncome: number
): LifeEventImpact {
  let oneTimeExpenses = 0;
  let monthlyAdjustment = 0;
  let incomeOverride: number | null = null;
  let incomePercentChange: number | null = null;

  for (const event of events) {
    switch (event.type) {
      case 'one-time':
        if (event.year === currentYear && event.amount !== undefined) {
          // Negative amounts are expenses
          oneTimeExpenses += Math.abs(event.amount);
        }
        break;

      case 'ongoing':
        if (event.startYear && currentYear >= event.startYear) {
          monthlyAdjustment += event.monthlyAmount || 0;
        }
        break;

      case 'phase':
        if (
          event.startYear &&
          event.endYear &&
          currentYear >= event.startYear &&
          currentYear <= event.endYear
        ) {
          monthlyAdjustment += event.monthlyAmount || 0;
        }
        break;

      case 'income-change':
        if (event.year === currentYear) {
          if (event.newAnnualIncome !== undefined) {
            incomeOverride = event.newAnnualIncome;
          } else if (event.percentChange !== undefined) {
            incomePercentChange = event.percentChange;
          }
        }
        break;
    }
  }

  return { oneTimeExpenses, monthlyAdjustment, incomeOverride, incomePercentChange };
}

/**
 * Create an empty cash flow breakdown
 */
function createEmptyCashFlow(): CashFlowBreakdown {
  return {
    income: 0,
    toRent: 0,
    toMortgageInterest: 0,
    toMortgagePrincipal: 0,
    toPropertyTax: 0,
    toInsurance: 0,
    toMaintenance: 0,
    toStrata: 0,
    toUtilities: 0,
    toOtherExpenses: 0,
    toLifeEvents: 0,
    toInvestments: 0,
  };
}

/**
 * Create a Year 0 snapshot (initial state)
 */
function createYear0Snapshot(
  profile: FinancialProfile,
  investmentPortfolio: number,
  homeValue: number,
  mortgageBalance: number
): YearlySnapshot {
  const homeEquity = homeValue - mortgageBalance;

  return {
    year: 0,
    annualIncome: profile.annualGrossIncome,
    monthlyHousingCost: 0,
    monthlyNonHousingExpenses: profile.monthlyNonHousingExpenses,
    monthlyLifeEventAdjustment: 0,
    monthlyDiscretionary: 0,
    monthlySavings: 0,
    investmentPortfolio,
    homeValue,
    mortgageBalance,
    homeEquity,
    netWorth: investmentPortfolio + homeEquity,
    cashFlow: createEmptyCashFlow(),
  };
}

/**
 * Project a rent scenario over time
 */
export function projectRentScenario(
  profile: FinancialProfile,
  scenario: RentScenario,
  lifeEvents: LifeEvent[],
  timeframeYears: number
): ProjectionResult {
  const snapshots: YearlySnapshot[] = [];

  // Initialize Year 0 - Full portfolio remains invested
  let portfolio = profile.currentInvestmentPortfolio;
  let currentIncome = profile.annualGrossIncome;
  let currentRent = scenario.monthlyRent;

  snapshots.push(
    createYear0Snapshot(profile, portfolio, 0, 0)
  );

  // Project Year 1 through Year N
  for (let year = 1; year <= timeframeYears; year++) {
    // 1. Apply income growth (except Year 1)
    if (year > 1) {
      currentIncome *= 1 + profile.annualRaisePercent / 100;
    }

    // 2. Process life events
    const lifeEventImpact = processLifeEvents(lifeEvents, year, currentIncome);

    if (lifeEventImpact.incomeOverride !== null) {
      currentIncome = lifeEventImpact.incomeOverride;
    } else if (lifeEventImpact.incomePercentChange !== null) {
      currentIncome *= 1 + lifeEventImpact.incomePercentChange / 100;
    }

    // 3. Calculate monthly housing cost
    const monthlyHousingCost = currentRent + scenario.rentersInsurance;

    // 4. Calculate discretionary income
    const monthlyIncome = currentIncome / 12;
    const monthlyLifeEventAdjustment = Math.abs(lifeEventImpact.monthlyAdjustment);
    const totalMonthlyExpenses =
      monthlyHousingCost +
      profile.monthlyNonHousingExpenses +
      monthlyLifeEventAdjustment;
    const monthlyDiscretionary = monthlyIncome - totalMonthlyExpenses;
    const monthlySavings = Math.max(
      0,
      monthlyDiscretionary * (profile.savingsRate / 100)
    );

    // 5. Grow portfolio through the year
    portfolio = growPortfolio(
      portfolio,
      monthlySavings,
      profile.expectedInvestmentReturn
    );

    // 6. Apply one-time expenses (deduct from portfolio)
    portfolio = Math.max(0, portfolio - lifeEventImpact.oneTimeExpenses);

    // 7. Build cash flow breakdown
    const cashFlow: CashFlowBreakdown = {
      income: currentIncome,
      toRent: currentRent * 12,
      toMortgageInterest: 0,
      toMortgagePrincipal: 0,
      toPropertyTax: 0,
      toInsurance: scenario.rentersInsurance * 12,
      toMaintenance: 0,
      toStrata: 0,
      toUtilities: 0,
      toOtherExpenses: profile.monthlyNonHousingExpenses * 12,
      toLifeEvents:
        lifeEventImpact.oneTimeExpenses + monthlyLifeEventAdjustment * 12,
      toInvestments: monthlySavings * 12,
    };

    // 8. Record snapshot
    snapshots.push({
      year,
      annualIncome: currentIncome,
      monthlyHousingCost,
      monthlyNonHousingExpenses: profile.monthlyNonHousingExpenses,
      monthlyLifeEventAdjustment,
      monthlyDiscretionary,
      monthlySavings,
      investmentPortfolio: portfolio,
      homeValue: 0,
      mortgageBalance: 0,
      homeEquity: 0,
      netWorth: portfolio,
      cashFlow,
    });

    // 9. Increase rent for next year
    currentRent *= 1 + scenario.annualRentIncrease / 100;
  }

  return { scenario: 'rent', snapshots };
}

/**
 * Project a buy scenario over time
 */
export function projectBuyScenario(
  profile: FinancialProfile,
  scenario: BuyScenario,
  lifeEvents: LifeEvent[],
  timeframeYears: number
): ProjectionResult {
  const snapshots: YearlySnapshot[] = [];

  // Initialize Year 0 - Apply purchase costs
  const downPayment = scenario.purchasePrice * (scenario.downPaymentPercent / 100);
  const closingCosts = calculateClosingCosts(
    scenario.purchasePrice,
    scenario.closingCostPercent,
    scenario.closingCostFlat
  );
  const totalLoan = calculateTotalLoan(
    scenario.purchasePrice,
    scenario.downPaymentPercent,
    scenario.mortgageInsurancePercent
  );

  let portfolio = Math.max(
    0,
    profile.currentInvestmentPortfolio - downPayment - closingCosts
  );
  let homeValue = scenario.purchasePrice;
  let mortgageBalance = totalLoan;
  let currentIncome = profile.annualGrossIncome;

  snapshots.push(
    createYear0Snapshot(profile, portfolio, homeValue, mortgageBalance)
  );

  // Project Year 1 through Year N
  for (let year = 1; year <= timeframeYears; year++) {
    // 1. Apply income growth (except Year 1)
    if (year > 1) {
      currentIncome *= 1 + profile.annualRaisePercent / 100;
    }

    // 2. Process life events
    const lifeEventImpact = processLifeEvents(lifeEvents, year, currentIncome);

    if (lifeEventImpact.incomeOverride !== null) {
      currentIncome = lifeEventImpact.incomeOverride;
    } else if (lifeEventImpact.incomePercentChange !== null) {
      currentIncome *= 1 + lifeEventImpact.incomePercentChange / 100;
    }

    // 3. Calculate mortgage payment and breakdown
    const rate = getRateForYear(
      scenario.interestRate,
      scenario.renewalRateAssumption,
      year
    );
    const remainingYears = getRemainingAmortization(scenario.amortizationYears, year);
    const monthlyPayment = calculateMonthlyMortgagePayment(
      mortgageBalance,
      rate,
      remainingYears
    );

    // Get interest/principal breakdown for the year
    const amortization = amortizeYear(mortgageBalance, rate, monthlyPayment);

    // 4. Calculate monthly housing cost
    const monthlyHousingCost =
      monthlyPayment +
      scenario.monthlyPropertyTax +
      scenario.monthlyHomeInsurance +
      scenario.monthlyStrataFees +
      scenario.monthlyUtilities +
      scenario.monthlyMaintenance;

    // 5. Calculate discretionary income
    const monthlyIncome = currentIncome / 12;
    const monthlyLifeEventAdjustment = Math.abs(lifeEventImpact.monthlyAdjustment);
    const totalMonthlyExpenses =
      monthlyHousingCost +
      profile.monthlyNonHousingExpenses +
      monthlyLifeEventAdjustment;
    const monthlyDiscretionary = monthlyIncome - totalMonthlyExpenses;
    const monthlySavings = Math.max(
      0,
      monthlyDiscretionary * (profile.savingsRate / 100)
    );

    // 6. Grow portfolio through the year
    portfolio = growPortfolio(
      portfolio,
      monthlySavings,
      profile.expectedInvestmentReturn
    );

    // 7. Apply one-time expenses (deduct from portfolio)
    portfolio = Math.max(0, portfolio - lifeEventImpact.oneTimeExpenses);

    // 8. Update home value (appreciation) and mortgage balance
    homeValue *= 1 + scenario.annualAppreciation / 100;
    mortgageBalance = Math.max(0, mortgageBalance - amortization.totalPrincipal);

    const homeEquity = homeValue - mortgageBalance;

    // 9. Build cash flow breakdown
    const cashFlow: CashFlowBreakdown = {
      income: currentIncome,
      toRent: 0,
      toMortgageInterest: amortization.totalInterest,
      toMortgagePrincipal: amortization.totalPrincipal,
      toPropertyTax: scenario.monthlyPropertyTax * 12,
      toInsurance: scenario.monthlyHomeInsurance * 12,
      toMaintenance: scenario.monthlyMaintenance * 12,
      toStrata: scenario.monthlyStrataFees * 12,
      toUtilities: scenario.monthlyUtilities * 12,
      toOtherExpenses: profile.monthlyNonHousingExpenses * 12,
      toLifeEvents:
        lifeEventImpact.oneTimeExpenses + monthlyLifeEventAdjustment * 12,
      toInvestments: monthlySavings * 12,
    };

    // 10. Record snapshot
    snapshots.push({
      year,
      annualIncome: currentIncome,
      monthlyHousingCost,
      monthlyNonHousingExpenses: profile.monthlyNonHousingExpenses,
      monthlyLifeEventAdjustment,
      monthlyDiscretionary,
      monthlySavings,
      investmentPortfolio: portfolio,
      homeValue,
      mortgageBalance,
      homeEquity,
      netWorth: portfolio + homeEquity,
      cashFlow,
    });
  }

  return { scenario: 'buy', snapshots };
}

/**
 * Project both scenarios and return results
 */
export function projectScenarios(
  profile: FinancialProfile,
  rentScenario: RentScenario,
  buyScenario: BuyScenario,
  lifeEvents: LifeEvent[],
  timeframeYears: number
): { rent: ProjectionResult; buy: ProjectionResult } {
  const rent = projectRentScenario(profile, rentScenario, lifeEvents, timeframeYears);
  const buy = projectBuyScenario(profile, buyScenario, lifeEvents, timeframeYears);

  return { rent, buy };
}

/**
 * Initialize Year 0 snapshots for both scenarios
 * This explicitly shows the immediate impact of buying vs renting
 */
export function initializeScenarios(
  profile: FinancialProfile,
  rentScenario: RentScenario,
  buyScenario: BuyScenario
): { rentYear0: YearlySnapshot; buyYear0: YearlySnapshot } {
  // RENT: Full portfolio remains invested from Day 0
  const rentYear0 = createYear0Snapshot(
    profile,
    profile.currentInvestmentPortfolio,
    0,
    0
  );

  // BUY: Down payment + closing costs leave portfolio IMMEDIATELY
  const downPayment = buyScenario.purchasePrice * (buyScenario.downPaymentPercent / 100);
  const closingCosts = calculateClosingCosts(
    buyScenario.purchasePrice,
    buyScenario.closingCostPercent,
    buyScenario.closingCostFlat
  );
  const totalLoan = calculateTotalLoan(
    buyScenario.purchasePrice,
    buyScenario.downPaymentPercent,
    buyScenario.mortgageInsurancePercent
  );

  const portfolioAfterPurchase = Math.max(
    0,
    profile.currentInvestmentPortfolio - downPayment - closingCosts
  );

  const buyYear0 = createYear0Snapshot(
    profile,
    portfolioAfterPurchase,
    buyScenario.purchasePrice,
    totalLoan
  );

  return { rentYear0, buyYear0 };
}
