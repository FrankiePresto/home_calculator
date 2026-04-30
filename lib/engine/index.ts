/**
 * Home Purchase Analyzer - Core Engine
 *
 * Export all calculation modules for use throughout the application
 */

// Types
export * from './types';

// Mortgage calculations
export {
  calculateMonthlyMortgagePayment,
  calculatePaymentBreakdown,
  generateAmortizationSchedule,
  amortizeYear,
  calculateTotalLoan,
  calculateClosingCosts,
  getRemainingAmortization,
  getRateForYear,
} from './mortgage';

// Investment calculations
export {
  growPortfolio,
  calculateFutureValue,
  calculateFutureValueWithContributions,
  calculateYearlyGrowth,
  calculateOpportunityCost,
  monthlyToAnnualReturn,
  annualToMonthlyReturn,
} from './investment';

// Projection engine
export {
  processLifeEvents,
  projectRentScenario,
  projectBuyScenario,
  projectScenarios,
  initializeScenarios,
} from './projection';

// Breakeven calculations
export {
  findTimeBreakeven,
  findAllCrossovers,
  findRentBreakeven,
  findPriceBreakeven,
  calculateBreakeven,
  determineWinner,
  getMilestoneComparisons,
} from './breakeven';

// Sensitivity analysis
export {
  runSensitivityAnalysis,
  getMostImpactfulVariable,
  formatForTornadoChart,
} from './sensitivity';

// Cash flow categorization
export {
  categorizeAnnualCashFlow,
  generateSankeyData,
  generateDetailedSankeyData,
  calculateCumulativeSunkCosts,
  compareSunkCosts,
  type AnnualCashFlow,
  type SankeyNode,
  type SankeyLink,
  type SankeyData,
} from './cashflow';

// Inflation adjustment
export {
  getDeflator,
  deflateValue,
  deflateSnapshot,
  deflateProjection,
} from './inflation';

// Feasibility analysis
export {
  analyzeFeasibility,
  getFeasibilitySummary,
} from './feasibility';

// Tax calculations
export {
  calculateFederalTax,
  calculateProvincialTax,
  calculateTotalTax,
  calculateHouseholdTax,
  calculateNetIncome,
  getProvinceName,
  SUPPORTED_PROVINCES,
  type Province,
  type TaxResult,
} from './taxes';
