/**
 * Cash flow categorization for the Home Purchase Analyzer
 *
 * Generates data for Sankey diagrams showing where money flows
 * and distinguishes between sunk costs and wealth building.
 */

import { YearlySnapshot, CashFlowBreakdown } from './types';

/**
 * Categorized annual cash flow
 */
export interface AnnualCashFlow {
  // Inflows
  grossIncome: number;

  // Outflows - Sunk Costs (money gone forever)
  sunkCosts: {
    rent: number;
    mortgageInterest: number;
    propertyTax: number;
    homeInsurance: number;
    maintenance: number;
    strataFees: number;
    utilities: number;
    otherExpenses: number;
    lifeEventExpenses: number;
  };

  // Outflows - Wealth Building
  wealthBuilding: {
    mortgagePrincipal: number;
    investments: number;
  };

  // Summary
  totalSunk: number;
  totalWealth: number;
}

/**
 * Sankey diagram data structures
 */
export interface SankeyNode {
  id: string;
  label: string;
  value: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * Convert a yearly snapshot's cash flow to categorized annual cash flow
 */
export function categorizeAnnualCashFlow(
  snapshot: YearlySnapshot,
  isRentScenario: boolean
): AnnualCashFlow {
  const cf = snapshot.cashFlow;

  const sunkCosts = {
    rent: cf.toRent,
    mortgageInterest: cf.toMortgageInterest,
    propertyTax: cf.toPropertyTax,
    homeInsurance: cf.toInsurance,
    maintenance: cf.toMaintenance,
    strataFees: cf.toStrata,
    utilities: cf.toUtilities,
    otherExpenses: cf.toOtherExpenses,
    lifeEventExpenses: cf.toLifeEvents,
  };

  const wealthBuilding = {
    mortgagePrincipal: cf.toMortgagePrincipal,
    investments: cf.toInvestments,
  };

  const totalSunk = Object.values(sunkCosts).reduce((a, b) => a + b, 0);
  const totalWealth = Object.values(wealthBuilding).reduce((a, b) => a + b, 0);

  // Include life-event income (windfalls, side hustle, inheritance) in total inflow
  // so the chart's stacked bar correctly sums to total annual cash flowing in.
  return {
    grossIncome: cf.income + (cf.fromLifeEvents ?? 0),
    sunkCosts,
    wealthBuilding,
    totalSunk,
    totalWealth,
  };
}

/**
 * Generate Sankey diagram data from a yearly snapshot
 */
export function generateSankeyData(
  snapshot: YearlySnapshot,
  isRentScenario: boolean
): SankeyData {
  const cashFlow = categorizeAnnualCashFlow(snapshot, isRentScenario);
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Income node
  nodes.push({
    id: 'income',
    label: 'Gross Income',
    value: cashFlow.grossIncome,
  });

  // Housing costs node (aggregate)
  const housingTotal = isRentScenario
    ? cashFlow.sunkCosts.rent + cashFlow.sunkCosts.homeInsurance
    : cashFlow.sunkCosts.mortgageInterest +
      cashFlow.wealthBuilding.mortgagePrincipal +
      cashFlow.sunkCosts.propertyTax +
      cashFlow.sunkCosts.homeInsurance +
      cashFlow.sunkCosts.maintenance +
      cashFlow.sunkCosts.strataFees +
      cashFlow.sunkCosts.utilities;

  if (housingTotal > 0) {
    nodes.push({
      id: 'housing',
      label: 'Housing',
      value: housingTotal,
    });

    links.push({
      source: 'income',
      target: 'housing',
      value: housingTotal,
    });
  }

  // Living expenses node
  if (cashFlow.sunkCosts.otherExpenses > 0) {
    nodes.push({
      id: 'living',
      label: 'Living Expenses',
      value: cashFlow.sunkCosts.otherExpenses,
    });

    links.push({
      source: 'income',
      target: 'living',
      value: cashFlow.sunkCosts.otherExpenses,
    });
  }

  // Life events node
  if (cashFlow.sunkCosts.lifeEventExpenses > 0) {
    nodes.push({
      id: 'lifeEvents',
      label: 'Life Events',
      value: cashFlow.sunkCosts.lifeEventExpenses,
    });

    links.push({
      source: 'income',
      target: 'lifeEvents',
      value: cashFlow.sunkCosts.lifeEventExpenses,
    });
  }

  // Sunk costs node
  if (cashFlow.totalSunk > 0) {
    nodes.push({
      id: 'sunk',
      label: 'Sunk Costs',
      value: cashFlow.totalSunk,
    });

    // Link housing sunk costs
    if (isRentScenario) {
      links.push({
        source: 'housing',
        target: 'sunk',
        value: cashFlow.sunkCosts.rent + cashFlow.sunkCosts.homeInsurance,
      });
    } else {
      const housingSunk =
        cashFlow.sunkCosts.mortgageInterest +
        cashFlow.sunkCosts.propertyTax +
        cashFlow.sunkCosts.homeInsurance +
        cashFlow.sunkCosts.maintenance +
        cashFlow.sunkCosts.strataFees +
        cashFlow.sunkCosts.utilities;
      if (housingSunk > 0) {
        links.push({
          source: 'housing',
          target: 'sunk',
          value: housingSunk,
        });
      }
    }

    // Link living expenses to sunk
    if (cashFlow.sunkCosts.otherExpenses > 0) {
      links.push({
        source: 'living',
        target: 'sunk',
        value: cashFlow.sunkCosts.otherExpenses,
      });
    }

    // Link life events to sunk
    if (cashFlow.sunkCosts.lifeEventExpenses > 0) {
      links.push({
        source: 'lifeEvents',
        target: 'sunk',
        value: cashFlow.sunkCosts.lifeEventExpenses,
      });
    }
  }

  // Wealth building node
  if (cashFlow.totalWealth > 0) {
    nodes.push({
      id: 'wealth',
      label: 'Wealth Building',
      value: cashFlow.totalWealth,
    });

    // Link mortgage principal (from housing) to wealth
    if (!isRentScenario && cashFlow.wealthBuilding.mortgagePrincipal > 0) {
      links.push({
        source: 'housing',
        target: 'wealth',
        value: cashFlow.wealthBuilding.mortgagePrincipal,
      });
    }

    // Link investments directly from income to wealth
    if (cashFlow.wealthBuilding.investments > 0) {
      links.push({
        source: 'income',
        target: 'wealth',
        value: cashFlow.wealthBuilding.investments,
      });
    }
  }

  return { nodes, links };
}

/**
 * Generate detailed Sankey data with individual cost categories
 */
export function generateDetailedSankeyData(
  snapshot: YearlySnapshot,
  isRentScenario: boolean
): SankeyData {
  const cf = snapshot.cashFlow;
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Income
  nodes.push({ id: 'income', label: 'Gross Income', value: cf.income });

  // Housing breakdown
  if (isRentScenario) {
    if (cf.toRent > 0) {
      nodes.push({ id: 'rent', label: 'Rent', value: cf.toRent });
      links.push({ source: 'income', target: 'rent', value: cf.toRent });
    }
  } else {
    if (cf.toMortgageInterest > 0) {
      nodes.push({ id: 'interest', label: 'Mortgage Interest', value: cf.toMortgageInterest });
      links.push({ source: 'income', target: 'interest', value: cf.toMortgageInterest });
    }
    if (cf.toMortgagePrincipal > 0) {
      nodes.push({ id: 'principal', label: 'Mortgage Principal', value: cf.toMortgagePrincipal });
      links.push({ source: 'income', target: 'principal', value: cf.toMortgagePrincipal });
    }
    if (cf.toPropertyTax > 0) {
      nodes.push({ id: 'propertyTax', label: 'Property Tax', value: cf.toPropertyTax });
      links.push({ source: 'income', target: 'propertyTax', value: cf.toPropertyTax });
    }
    if (cf.toMaintenance > 0) {
      nodes.push({ id: 'maintenance', label: 'Maintenance', value: cf.toMaintenance });
      links.push({ source: 'income', target: 'maintenance', value: cf.toMaintenance });
    }
    if (cf.toStrata > 0) {
      nodes.push({ id: 'strata', label: 'Strata/HOA', value: cf.toStrata });
      links.push({ source: 'income', target: 'strata', value: cf.toStrata });
    }
  }

  // Common costs
  if (cf.toInsurance > 0) {
    nodes.push({ id: 'insurance', label: 'Insurance', value: cf.toInsurance });
    links.push({ source: 'income', target: 'insurance', value: cf.toInsurance });
  }
  if (cf.toUtilities > 0) {
    nodes.push({ id: 'utilities', label: 'Utilities', value: cf.toUtilities });
    links.push({ source: 'income', target: 'utilities', value: cf.toUtilities });
  }
  if (cf.toOtherExpenses > 0) {
    nodes.push({ id: 'other', label: 'Other Expenses', value: cf.toOtherExpenses });
    links.push({ source: 'income', target: 'other', value: cf.toOtherExpenses });
  }
  if (cf.toLifeEvents > 0) {
    nodes.push({ id: 'lifeEvents', label: 'Life Events', value: cf.toLifeEvents });
    links.push({ source: 'income', target: 'lifeEvents', value: cf.toLifeEvents });
  }
  if (cf.toInvestments > 0) {
    nodes.push({ id: 'investments', label: 'Investments', value: cf.toInvestments });
    links.push({ source: 'income', target: 'investments', value: cf.toInvestments });
  }

  // Sunk costs destination
  const sunkTotal = cf.toRent + cf.toMortgageInterest + cf.toPropertyTax +
    cf.toInsurance + cf.toMaintenance + cf.toStrata + cf.toUtilities +
    cf.toOtherExpenses + cf.toLifeEvents;

  if (sunkTotal > 0) {
    nodes.push({ id: 'sunk', label: 'Sunk Costs', value: sunkTotal });

    // Link all sunk cost items
    if (cf.toRent > 0) links.push({ source: 'rent', target: 'sunk', value: cf.toRent });
    if (cf.toMortgageInterest > 0) links.push({ source: 'interest', target: 'sunk', value: cf.toMortgageInterest });
    if (cf.toPropertyTax > 0) links.push({ source: 'propertyTax', target: 'sunk', value: cf.toPropertyTax });
    if (cf.toInsurance > 0) links.push({ source: 'insurance', target: 'sunk', value: cf.toInsurance });
    if (cf.toMaintenance > 0) links.push({ source: 'maintenance', target: 'sunk', value: cf.toMaintenance });
    if (cf.toStrata > 0) links.push({ source: 'strata', target: 'sunk', value: cf.toStrata });
    if (cf.toUtilities > 0) links.push({ source: 'utilities', target: 'sunk', value: cf.toUtilities });
    if (cf.toOtherExpenses > 0) links.push({ source: 'other', target: 'sunk', value: cf.toOtherExpenses });
    if (cf.toLifeEvents > 0) links.push({ source: 'lifeEvents', target: 'sunk', value: cf.toLifeEvents });
  }

  // Wealth building destination
  const wealthTotal = cf.toMortgagePrincipal + cf.toInvestments;
  if (wealthTotal > 0) {
    nodes.push({ id: 'wealth', label: 'Wealth Building', value: wealthTotal });

    if (cf.toMortgagePrincipal > 0) links.push({ source: 'principal', target: 'wealth', value: cf.toMortgagePrincipal });
    if (cf.toInvestments > 0) links.push({ source: 'investments', target: 'wealth', value: cf.toInvestments });
  }

  return { nodes, links };
}

/**
 * Calculate cumulative sunk costs over multiple years
 */
export function calculateCumulativeSunkCosts(
  snapshots: YearlySnapshot[],
  isRentScenario: boolean
): number[] {
  let cumulative = 0;
  return snapshots.map((snapshot) => {
    const annual = categorizeAnnualCashFlow(snapshot, isRentScenario);
    cumulative += annual.totalSunk;
    return cumulative;
  });
}

/**
 * Compare sunk costs between rent and buy scenarios
 */
export function compareSunkCosts(
  rentSnapshot: YearlySnapshot,
  buySnapshot: YearlySnapshot
): {
  rentSunk: AnnualCashFlow['sunkCosts'];
  buySunk: AnnualCashFlow['sunkCosts'];
  rentTotal: number;
  buyTotal: number;
  difference: number;
  winner: 'rent' | 'buy' | 'tie';
} {
  const rentFlow = categorizeAnnualCashFlow(rentSnapshot, true);
  const buyFlow = categorizeAnnualCashFlow(buySnapshot, false);

  const difference = rentFlow.totalSunk - buyFlow.totalSunk;

  let winner: 'rent' | 'buy' | 'tie';
  if (Math.abs(difference) < 100) {
    winner = 'tie';
  } else if (difference > 0) {
    winner = 'buy';
  } else {
    winner = 'rent';
  }

  return {
    rentSunk: rentFlow.sunkCosts,
    buySunk: buyFlow.sunkCosts,
    rentTotal: rentFlow.totalSunk,
    buyTotal: buyFlow.totalSunk,
    difference: Math.abs(difference),
    winner,
  };
}
