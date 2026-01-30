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
import { calculateNetIncome, calculateHouseholdTax, Province } from './taxes';

/**
 * Calculate effective household income after applying life events and taxes
 * Handles both single and dual income households with per-earner life events
 */
function calculateEffectiveHouseholdIncome(
  primaryGross: number,
  secondaryGross: number,
  lifeEventImpact: LifeEventImpact,
  profile: FinancialProfile
): { effectivePrimary: number; effectiveSecondary: number; totalNet: number } {
  // Apply life event impacts to each earner
  let effectivePrimary = primaryGross;
  let effectiveSecondary = secondaryGross;

  // Primary income adjustments
  if (lifeEventImpact.primaryIncomeOverride !== null) {
    effectivePrimary = lifeEventImpact.primaryIncomeOverride;
  } else if (lifeEventImpact.primaryIncomePercentChange !== null) {
    effectivePrimary *= 1 + lifeEventImpact.primaryIncomePercentChange / 100;
  }
  if (lifeEventImpact.primaryIncomeMultiplier !== null) {
    effectivePrimary *= lifeEventImpact.primaryIncomeMultiplier;
  }

  // Secondary income adjustments
  if (lifeEventImpact.secondaryIncomeOverride !== null) {
    effectiveSecondary = lifeEventImpact.secondaryIncomeOverride;
  } else if (lifeEventImpact.secondaryIncomePercentChange !== null) {
    effectiveSecondary *= 1 + lifeEventImpact.secondaryIncomePercentChange / 100;
  }
  if (lifeEventImpact.secondaryIncomeMultiplier !== null) {
    effectiveSecondary *= lifeEventImpact.secondaryIncomeMultiplier;
  }

  // Calculate net income after taxes
  let totalNet: number;
  if (!profile.includeTaxes) {
    totalNet = effectivePrimary + effectiveSecondary;
  } else {
    const province = (profile.province || 'ON') as Province;
    if (profile.incomeType === 'dual' && effectiveSecondary > 0) {
      const householdTax = calculateHouseholdTax(effectivePrimary, effectiveSecondary, province);
      totalNet = householdTax.netIncome;
    } else {
      totalNet = calculateNetIncome(effectivePrimary, province);
    }
  }

  return { effectivePrimary, effectiveSecondary, totalNet };
}

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
  let incomeMultiplier: number | null = null;

  // Per-earner tracking for dual income households
  let primaryIncomeMultiplier: number | null = null;
  let secondaryIncomeMultiplier: number | null = null;
  let primaryIncomeOverride: number | null = null;
  let secondaryIncomeOverride: number | null = null;
  let primaryIncomePercentChange: number | null = null;
  let secondaryIncomePercentChange: number | null = null;

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
        const earner = event.affectedEarner || 'primary';

        // Handle phase-based income changes (temporary reduction like sabbatical/mat leave)
        if (event.incomeChangeDuration === 'phase') {
          if (
            event.startYear &&
            event.endYear &&
            currentYear >= event.startYear &&
            currentYear <= event.endYear &&
            event.incomeMultiplier !== undefined
          ) {
            if (earner === 'secondary') {
              secondaryIncomeMultiplier = event.incomeMultiplier;
            } else {
              primaryIncomeMultiplier = event.incomeMultiplier;
            }
            // Legacy field for backward compatibility
            incomeMultiplier = event.incomeMultiplier;
          }
        } else {
          // Ongoing (permanent) income change
          if (event.year === currentYear) {
            if (event.newAnnualIncome !== undefined) {
              if (earner === 'secondary') {
                secondaryIncomeOverride = event.newAnnualIncome;
              } else {
                primaryIncomeOverride = event.newAnnualIncome;
              }
              incomeOverride = event.newAnnualIncome;
            } else if (event.percentChange !== undefined) {
              if (earner === 'secondary') {
                secondaryIncomePercentChange = event.percentChange;
              } else {
                primaryIncomePercentChange = event.percentChange;
              }
              incomePercentChange = event.percentChange;
            }
          }
        }
        break;
    }
  }

  return {
    oneTimeExpenses,
    monthlyAdjustment,
    incomeOverride,
    incomePercentChange,
    incomeMultiplier,
    primaryIncomeMultiplier,
    secondaryIncomeMultiplier,
    primaryIncomeOverride,
    secondaryIncomeOverride,
    primaryIncomePercentChange,
    secondaryIncomePercentChange,
  };
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
  mortgageBalance: number,
  nonInvestedSavingsBalance: number = 0
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
    nonInvestedSavingsBalance,
    homeValue,
    mortgageBalance,
    homeEquity,
    netWorth: investmentPortfolio + nonInvestedSavingsBalance + homeEquity,
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
  let nonInvestedSavings = 0; // Starts at 0 for rent scenario

  // Track both incomes separately for dual income households
  let currentPrimaryIncome = profile.annualGrossIncome;
  let currentSecondaryIncome = profile.incomeType === 'dual' ? (profile.secondaryIncome || 0) : 0;
  let currentRent = scenario.monthlyRent;

  snapshots.push(
    createYear0Snapshot(profile, portfolio, 0, 0, nonInvestedSavings)
  );

  // Project Year 1 through Year N
  for (let year = 1; year <= timeframeYears; year++) {
    // 1. Apply income growth (except Year 1)
    if (year > 1) {
      currentPrimaryIncome *= 1 + profile.annualRaisePercent / 100;
      currentSecondaryIncome *= 1 + profile.annualRaisePercent / 100;
    }

    // 2. Process life events
    const lifeEventImpact = processLifeEvents(lifeEvents, year, currentPrimaryIncome);

    // 3. Calculate effective income for each earner after life events and taxes
    const incomeResult = calculateEffectiveHouseholdIncome(
      currentPrimaryIncome,
      currentSecondaryIncome,
      lifeEventImpact,
      profile
    );

    const netAnnualIncome = incomeResult.totalNet;

    // 3. Calculate monthly housing cost
    const monthlyHousingCost = currentRent + scenario.rentersInsurance;

    // 4. Calculate discretionary income (use net income for actual cash flow)
    const monthlyIncome = netAnnualIncome / 12;
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

    // 5. Split savings between invested and non-invested
    const nonInvestedRate = profile.nonInvestedSavingsRate || 0;
    const monthlyNonInvestedSavings = monthlySavings * (nonInvestedRate / 100);
    const monthlyInvestedSavings = monthlySavings - monthlyNonInvestedSavings;

    // 6. Grow portfolio (invested savings) through the year
    portfolio = growPortfolio(
      portfolio,
      monthlyInvestedSavings,
      profile.expectedInvestmentReturn
    );

    // 7. Grow non-invested savings (HISA) through the year
    const hisaRate = profile.nonInvestedReturnRate || 2;
    nonInvestedSavings = growPortfolio(
      nonInvestedSavings,
      monthlyNonInvestedSavings,
      hisaRate
    );

    // 8. Apply one-time expenses (deduct from portfolio first, then non-invested)
    let remainingExpense = lifeEventImpact.oneTimeExpenses;
    if (remainingExpense > 0) {
      const fromPortfolio = Math.min(portfolio, remainingExpense);
      portfolio = Math.max(0, portfolio - fromPortfolio);
      remainingExpense -= fromPortfolio;
      if (remainingExpense > 0) {
        nonInvestedSavings = Math.max(0, nonInvestedSavings - remainingExpense);
      }
    }

    // 9. Build cash flow breakdown (use net income for accurate reporting)
    const cashFlow: CashFlowBreakdown = {
      income: netAnnualIncome,
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

    // 10. Record snapshot (use net income for actual year's income)
    snapshots.push({
      year,
      annualIncome: netAnnualIncome,
      monthlyHousingCost,
      monthlyNonHousingExpenses: profile.monthlyNonHousingExpenses,
      monthlyLifeEventAdjustment,
      monthlyDiscretionary,
      monthlySavings,
      investmentPortfolio: portfolio,
      nonInvestedSavingsBalance: nonInvestedSavings,
      homeValue: 0,
      mortgageBalance: 0,
      homeEquity: 0,
      netWorth: portfolio + nonInvestedSavings,
      cashFlow,
    });

    // 11. Increase rent for next year
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
  let nonInvestedSavings = 0; // Starts at 0 for buy scenario
  let homeValue = scenario.purchasePrice;
  let mortgageBalance = totalLoan;

  // Track both incomes separately for dual income households
  let currentPrimaryIncome = profile.annualGrossIncome;
  let currentSecondaryIncome = profile.incomeType === 'dual' ? (profile.secondaryIncome || 0) : 0;

  snapshots.push(
    createYear0Snapshot(profile, portfolio, homeValue, mortgageBalance, nonInvestedSavings)
  );

  // Project Year 1 through Year N
  for (let year = 1; year <= timeframeYears; year++) {
    // 1. Apply income growth (except Year 1)
    if (year > 1) {
      currentPrimaryIncome *= 1 + profile.annualRaisePercent / 100;
      currentSecondaryIncome *= 1 + profile.annualRaisePercent / 100;
    }

    // 2. Process life events
    const lifeEventImpact = processLifeEvents(lifeEvents, year, currentPrimaryIncome);

    // 3. Calculate effective income for each earner after life events and taxes
    const incomeResult = calculateEffectiveHouseholdIncome(
      currentPrimaryIncome,
      currentSecondaryIncome,
      lifeEventImpact,
      profile
    );

    const netAnnualIncome = incomeResult.totalNet;

    // 4. Calculate mortgage payment and breakdown
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

    // 5. Calculate discretionary income (use net income for actual cash flow)
    const monthlyIncome = netAnnualIncome / 12;
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

    // 6. Split savings between invested and non-invested
    const nonInvestedRate = profile.nonInvestedSavingsRate || 0;
    const monthlyNonInvestedSavings = monthlySavings * (nonInvestedRate / 100);
    const monthlyInvestedSavings = monthlySavings - monthlyNonInvestedSavings;

    // 7. Grow portfolio (invested savings) through the year
    portfolio = growPortfolio(
      portfolio,
      monthlyInvestedSavings,
      profile.expectedInvestmentReturn
    );

    // 8. Grow non-invested savings (HISA) through the year
    const hisaRate = profile.nonInvestedReturnRate || 2;
    nonInvestedSavings = growPortfolio(
      nonInvestedSavings,
      monthlyNonInvestedSavings,
      hisaRate
    );

    // 9. Apply one-time expenses (deduct from portfolio first, then non-invested)
    let remainingExpense = lifeEventImpact.oneTimeExpenses;
    if (remainingExpense > 0) {
      const fromPortfolio = Math.min(portfolio, remainingExpense);
      portfolio = Math.max(0, portfolio - fromPortfolio);
      remainingExpense -= fromPortfolio;
      if (remainingExpense > 0) {
        nonInvestedSavings = Math.max(0, nonInvestedSavings - remainingExpense);
      }
    }

    // 10. Update home value (appreciation) and mortgage balance
    homeValue *= 1 + scenario.annualAppreciation / 100;
    mortgageBalance = Math.max(0, mortgageBalance - amortization.totalPrincipal);

    const homeEquity = homeValue - mortgageBalance;

    // 11. Build cash flow breakdown (use net income for accurate reporting)
    const cashFlow: CashFlowBreakdown = {
      income: netAnnualIncome,
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

    // 12. Record snapshot (use net income for actual year's income)
    snapshots.push({
      year,
      annualIncome: netAnnualIncome,
      monthlyHousingCost,
      monthlyNonHousingExpenses: profile.monthlyNonHousingExpenses,
      monthlyLifeEventAdjustment,
      monthlyDiscretionary,
      monthlySavings,
      investmentPortfolio: portfolio,
      nonInvestedSavingsBalance: nonInvestedSavings,
      homeValue,
      mortgageBalance,
      homeEquity,
      netWorth: portfolio + nonInvestedSavings + homeEquity,
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
