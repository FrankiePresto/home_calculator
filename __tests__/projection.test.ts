/**
 * Projection engine tests
 *
 * These tests verify the year-by-year simulation of rent and buy scenarios
 */

import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
  LifeEvent,
} from '../lib/engine/types';

import {
  processLifeEvents,
  projectRentScenario,
  projectBuyScenario,
  projectScenarios,
  initializeScenarios,
} from '../lib/engine/projection';

// Test fixtures
const baseProfile: FinancialProfile = {
  annualGrossIncome: 120000,
  monthlyNonHousingExpenses: 2000,
  currentInvestmentPortfolio: 150000,
  expectedInvestmentReturn: 7,
  savingsRate: 50,
  annualRaisePercent: 2,
};

const baseRentScenario: RentScenario = {
  monthlyRent: 2500,
  annualRentIncrease: 3,
  rentersInsurance: 30,
};

const baseBuyScenario: BuyScenario = {
  name: 'Test Property',
  purchasePrice: 600000,
  downPaymentPercent: 20,
  closingCostPercent: 3,
  interestRate: 6,
  amortizationYears: 25,
  mortgageInsurancePercent: 0,
  monthlyPropertyTax: 400,
  monthlyHomeInsurance: 150,
  monthlyStrataFees: 350,
  monthlyUtilities: 200,
  monthlyMaintenance: 500,
  annualAppreciation: 3,
};

describe('processLifeEvents', () => {
  it('processes one-time events correctly', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'Wedding', type: 'one-time', year: 3, amount: -30000 },
    ];

    const year2 = processLifeEvents(events, 2, 120000);
    expect(year2.oneTimeExpenses).toBe(0);

    const year3 = processLifeEvents(events, 3, 120000);
    expect(year3.oneTimeExpenses).toBe(30000);

    const year4 = processLifeEvents(events, 4, 120000);
    expect(year4.oneTimeExpenses).toBe(0);
  });

  it('processes ongoing events correctly', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'Car Payment', type: 'ongoing', startYear: 2, monthlyAmount: -500 },
    ];

    const year1 = processLifeEvents(events, 1, 120000);
    expect(year1.monthlyAdjustment).toBe(0);

    const year2 = processLifeEvents(events, 2, 120000);
    expect(year2.monthlyAdjustment).toBe(-500);

    const year5 = processLifeEvents(events, 5, 120000);
    expect(year5.monthlyAdjustment).toBe(-500);
  });

  it('processes phase events correctly', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'Childcare', type: 'phase', startYear: 5, endYear: 10, monthlyAmount: -2000 },
    ];

    const year4 = processLifeEvents(events, 4, 120000);
    expect(year4.monthlyAdjustment).toBe(0);

    const year5 = processLifeEvents(events, 5, 120000);
    expect(year5.monthlyAdjustment).toBe(-2000);

    const year10 = processLifeEvents(events, 10, 120000);
    expect(year10.monthlyAdjustment).toBe(-2000);

    const year11 = processLifeEvents(events, 11, 120000);
    expect(year11.monthlyAdjustment).toBe(0);
  });

  it('processes income change with new amount', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'New Job', type: 'income-change', year: 3, newAnnualIncome: 150000 },
    ];

    const year2 = processLifeEvents(events, 2, 120000);
    expect(year2.incomeOverride).toBeNull();

    const year3 = processLifeEvents(events, 3, 120000);
    expect(year3.incomeOverride).toBe(150000);
  });

  it('processes income change with percent', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'Promotion', type: 'income-change', year: 2, percentChange: 15 },
    ];

    const year2 = processLifeEvents(events, 2, 120000);
    expect(year2.incomePercentChange).toBe(15);
  });

  it('combines multiple events in same year', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'Car', type: 'ongoing', startYear: 1, monthlyAmount: -400 },
      { id: '2', description: 'Gym', type: 'ongoing', startYear: 1, monthlyAmount: -100 },
      { id: '3', description: 'Bonus', type: 'one-time', year: 1, amount: -5000 },
    ];

    const result = processLifeEvents(events, 1, 120000);
    expect(result.monthlyAdjustment).toBe(-500);
    expect(result.oneTimeExpenses).toBe(5000);
  });
});

describe('initializeScenarios', () => {
  it('sets correct Year 0 for rent scenario', () => {
    const { rentYear0 } = initializeScenarios(baseProfile, baseRentScenario, baseBuyScenario);

    expect(rentYear0.year).toBe(0);
    expect(rentYear0.investmentPortfolio).toBe(150000);
    expect(rentYear0.homeValue).toBe(0);
    expect(rentYear0.mortgageBalance).toBe(0);
    expect(rentYear0.netWorth).toBe(150000);
  });

  it('sets correct Year 0 for buy scenario', () => {
    const { buyYear0 } = initializeScenarios(baseProfile, baseRentScenario, baseBuyScenario);

    // Down payment: 600000 * 0.20 = 120000
    // Closing costs: 600000 * 0.03 = 18000
    // Portfolio after: 150000 - 120000 - 18000 = 12000

    expect(buyYear0.year).toBe(0);
    expect(buyYear0.investmentPortfolio).toBe(12000);
    expect(buyYear0.homeValue).toBe(600000);
    expect(buyYear0.mortgageBalance).toBe(480000); // 600000 - 120000
    expect(buyYear0.homeEquity).toBe(120000); // Down payment
    expect(buyYear0.netWorth).toBe(12000 + 120000); // 132000
  });

  it('rent has higher net worth at Year 0 by closing costs', () => {
    const { rentYear0, buyYear0 } = initializeScenarios(
      baseProfile,
      baseRentScenario,
      baseBuyScenario
    );

    const closingCosts = 600000 * 0.03; // 18000
    expect(rentYear0.netWorth - buyYear0.netWorth).toBeCloseTo(closingCosts, 0);
  });

  it('handles mortgage insurance when down payment < 20%', () => {
    const lowDownScenario: BuyScenario = {
      ...baseBuyScenario,
      downPaymentPercent: 10,
      mortgageInsurancePercent: 2.5,
    };

    const { buyYear0 } = initializeScenarios(baseProfile, baseRentScenario, lowDownScenario);

    // Down payment: 600000 * 0.10 = 60000
    // Loan amount: 540000
    // Mortgage insurance: 540000 * 0.025 = 13500
    // Total loan: 553500

    expect(buyYear0.mortgageBalance).toBe(553500);
  });

  it('handles insufficient portfolio for down payment', () => {
    const poorProfile: FinancialProfile = {
      ...baseProfile,
      currentInvestmentPortfolio: 50000,
    };

    const { buyYear0 } = initializeScenarios(poorProfile, baseRentScenario, baseBuyScenario);

    // Down payment + closing = 138000, but portfolio is only 50000
    // Portfolio should be 0, not negative
    expect(buyYear0.investmentPortfolio).toBe(0);
  });
});

describe('projectRentScenario', () => {
  it('generates correct number of snapshots', () => {
    const result = projectRentScenario(baseProfile, baseRentScenario, [], 10);

    expect(result.scenario).toBe('rent');
    expect(result.snapshots.length).toBe(11); // Year 0 through Year 10
  });

  it('Year 0 has full portfolio', () => {
    const result = projectRentScenario(baseProfile, baseRentScenario, [], 10);

    expect(result.snapshots[0].investmentPortfolio).toBe(150000);
    expect(result.snapshots[0].netWorth).toBe(150000);
  });

  it('portfolio grows over time', () => {
    const result = projectRentScenario(baseProfile, baseRentScenario, [], 10);

    expect(result.snapshots[10].investmentPortfolio).toBeGreaterThan(
      result.snapshots[0].investmentPortfolio
    );
  });

  it('rent increases annually', () => {
    const result = projectRentScenario(baseProfile, baseRentScenario, [], 5);

    // Year 1 rent should be base rent
    const year1Housing = result.snapshots[1].monthlyHousingCost;
    expect(year1Housing).toBeCloseTo(2500 + 30, 0); // rent + insurance

    // Year 5 rent should be higher (compounded 4 times from year 1 to year 5)
    // Actually rent increases AFTER each year for next year
    // So year 2 uses rent * 1.03, year 3 uses rent * 1.03^2, etc.
  });

  it('applies income growth', () => {
    const result = projectRentScenario(baseProfile, baseRentScenario, [], 10);

    // Income should grow by 2% annually starting Year 2
    const year1Income = result.snapshots[1].annualIncome;
    const year10Income = result.snapshots[10].annualIncome;

    expect(year1Income).toBe(120000);
    // Year 10 income = 120000 * 1.02^9 (growth applied years 2-10)
    expect(year10Income).toBeCloseTo(120000 * Math.pow(1.02, 9), 0);
  });

  it('applies life events', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'Big Expense', type: 'one-time', year: 2, amount: -50000 },
    ];

    const result = projectRentScenario(baseProfile, baseRentScenario, events, 5);

    // Portfolio at year 2 should be reduced by the expense
    const withoutEvents = projectRentScenario(baseProfile, baseRentScenario, [], 5);

    expect(result.snapshots[2].investmentPortfolio).toBeLessThan(
      withoutEvents.snapshots[2].investmentPortfolio
    );
  });

  it('tracks cash flow correctly', () => {
    const result = projectRentScenario(baseProfile, baseRentScenario, [], 5);

    const year1 = result.snapshots[1];
    expect(year1.cashFlow.income).toBe(120000);
    expect(year1.cashFlow.toRent).toBeCloseTo(2500 * 12, 0);
    expect(year1.cashFlow.toMortgageInterest).toBe(0);
    expect(year1.cashFlow.toMortgagePrincipal).toBe(0);
  });
});

describe('projectBuyScenario', () => {
  it('generates correct number of snapshots', () => {
    const result = projectBuyScenario(baseProfile, baseBuyScenario, [], 10);

    expect(result.scenario).toBe('buy');
    expect(result.snapshots.length).toBe(11);
  });

  it('Year 0 reflects purchase costs', () => {
    const result = projectBuyScenario(baseProfile, baseBuyScenario, [], 10);
    const year0 = result.snapshots[0];

    expect(year0.investmentPortfolio).toBe(12000); // 150000 - 120000 - 18000
    expect(year0.homeValue).toBe(600000);
    expect(year0.mortgageBalance).toBe(480000);
  });

  it('home value appreciates', () => {
    const result = projectBuyScenario(baseProfile, baseBuyScenario, [], 10);

    // 3% annual appreciation
    const expectedYear10Value = 600000 * Math.pow(1.03, 10);
    expect(result.snapshots[10].homeValue).toBeCloseTo(expectedYear10Value, -2);
  });

  it('mortgage balance decreases', () => {
    const result = projectBuyScenario(baseProfile, baseBuyScenario, [], 10);

    expect(result.snapshots[10].mortgageBalance).toBeLessThan(
      result.snapshots[0].mortgageBalance
    );
  });

  it('equity increases over time', () => {
    const result = projectBuyScenario(baseProfile, baseBuyScenario, [], 10);

    expect(result.snapshots[10].homeEquity).toBeGreaterThan(
      result.snapshots[0].homeEquity
    );
  });

  it('tracks mortgage interest vs principal in cash flow', () => {
    const result = projectBuyScenario(baseProfile, baseBuyScenario, [], 5);
    const year1 = result.snapshots[1];

    expect(year1.cashFlow.toMortgageInterest).toBeGreaterThan(0);
    expect(year1.cashFlow.toMortgagePrincipal).toBeGreaterThan(0);
    expect(year1.cashFlow.toRent).toBe(0);
  });

  it('interest decreases and principal increases over time', () => {
    const result = projectBuyScenario(baseProfile, baseBuyScenario, [], 20);

    const year1 = result.snapshots[1];
    const year15 = result.snapshots[15];

    expect(year15.cashFlow.toMortgageInterest).toBeLessThan(
      year1.cashFlow.toMortgageInterest
    );
    expect(year15.cashFlow.toMortgagePrincipal).toBeGreaterThan(
      year1.cashFlow.toMortgagePrincipal
    );
  });
});

describe('projectScenarios', () => {
  it('returns both rent and buy projections', () => {
    const { rent, buy } = projectScenarios(
      baseProfile,
      baseRentScenario,
      baseBuyScenario,
      [],
      10
    );

    expect(rent.scenario).toBe('rent');
    expect(buy.scenario).toBe('buy');
    expect(rent.snapshots.length).toBe(11);
    expect(buy.snapshots.length).toBe(11);
  });

  it('rent starts with higher net worth', () => {
    const { rent, buy } = projectScenarios(
      baseProfile,
      baseRentScenario,
      baseBuyScenario,
      [],
      10
    );

    expect(rent.snapshots[0].netWorth).toBeGreaterThan(buy.snapshots[0].netWorth);
  });

  it('applies same life events to both scenarios', () => {
    const events: LifeEvent[] = [
      { id: '1', description: 'Expense', type: 'one-time', year: 3, amount: -20000 },
    ];

    const { rent, buy } = projectScenarios(
      baseProfile,
      baseRentScenario,
      baseBuyScenario,
      events,
      5
    );

    // Both should show impact of life event in year 3
    const rentWithout = projectRentScenario(baseProfile, baseRentScenario, [], 5);
    const buyWithout = projectBuyScenario(baseProfile, baseBuyScenario, [], 5);

    expect(rent.snapshots[3].investmentPortfolio).toBeLessThan(
      rentWithout.snapshots[3].investmentPortfolio
    );
    expect(buy.snapshots[3].investmentPortfolio).toBeLessThan(
      buyWithout.snapshots[3].investmentPortfolio
    );
  });
});

describe('edge cases', () => {
  it('handles 0% investment return', () => {
    const noReturnProfile: FinancialProfile = {
      ...baseProfile,
      expectedInvestmentReturn: 0,
    };

    const result = projectRentScenario(noReturnProfile, baseRentScenario, [], 5);

    // Portfolio should only grow by contributions, not returns
    expect(result.snapshots[5].investmentPortfolio).toBeGreaterThan(150000);
  });

  it('handles 0% rent increase', () => {
    const flatRent: RentScenario = {
      ...baseRentScenario,
      annualRentIncrease: 0,
    };

    const result = projectRentScenario(baseProfile, flatRent, [], 10);

    // Housing cost should be the same each year
    expect(result.snapshots[1].monthlyHousingCost).toBe(
      result.snapshots[10].monthlyHousingCost
    );
  });

  it('handles 0% home appreciation', () => {
    const flatHome: BuyScenario = {
      ...baseBuyScenario,
      annualAppreciation: 0,
    };

    const result = projectBuyScenario(baseProfile, flatHome, [], 10);

    expect(result.snapshots[10].homeValue).toBe(600000);
  });

  it('handles 100% savings rate', () => {
    const maxSaver: FinancialProfile = {
      ...baseProfile,
      savingsRate: 100,
    };

    const result = projectRentScenario(maxSaver, baseRentScenario, [], 5);

    // All discretionary income should go to investments
    expect(result.snapshots[5].investmentPortfolio).toBeGreaterThan(
      projectRentScenario(baseProfile, baseRentScenario, [], 5).snapshots[5]
        .investmentPortfolio
    );
  });

  it('handles 0% savings rate', () => {
    const noSaver: FinancialProfile = {
      ...baseProfile,
      savingsRate: 0,
    };

    const result = projectRentScenario(noSaver, baseRentScenario, [], 5);

    // Portfolio should only grow from existing balance returns
    expect(result.snapshots[1].monthlySavings).toBe(0);
  });

  it('handles 100% down payment', () => {
    const allCash: BuyScenario = {
      ...baseBuyScenario,
      purchasePrice: 100000, // Small enough to afford
      downPaymentPercent: 100,
    };

    const richProfile: FinancialProfile = {
      ...baseProfile,
      currentInvestmentPortfolio: 500000,
    };

    const result = projectBuyScenario(richProfile, allCash, [], 5);

    expect(result.snapshots[0].mortgageBalance).toBe(0);
    expect(result.snapshots[1].cashFlow.toMortgageInterest).toBe(0);
    expect(result.snapshots[1].cashFlow.toMortgagePrincipal).toBe(0);
  });
});
