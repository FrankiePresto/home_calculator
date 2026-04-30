/**
 * Core TypeScript interfaces for the Home Purchase Analyzer
 * All financial calculations are strictly typed for accuracy
 */

// =============================================================================
// Financial Profile
// =============================================================================

export interface FinancialProfile {
  annualGrossIncome: number;          // Pre-tax annual income
  monthlyNonHousingExpenses: number;  // Food, transport, etc. (non-housing)
  currentInvestmentPortfolio: number; // Current liquid investments
  expectedInvestmentReturn: number;   // Annual % (default: 7%)
  savingsRate: number;                // % of discretionary income invested (0-100)
  annualRaisePercent: number;         // Expected annual income growth (default: 2%)

  // Non-invested savings (P4: HISA/emergency fund)
  useAdvancedSavings: boolean;        // Toggle advanced savings split mode
  nonInvestedSavingsRate: number;     // % of savings NOT invested (0-100)
  nonInvestedReturnRate: number;      // Return rate for HISA (default: 2%)

  // Tax settings (P6: Canadian tax calculator)
  includeTaxes: boolean;              // Toggle tax calculations
  province: string;                   // 'BC', 'ON', 'AB' (default: 'ON')

  // Inflation
  inflationRate: number;              // Annual inflation rate % (default: 2%)

  // Dual income support
  incomeType: 'single' | 'dual';      // Single or dual income household
  secondaryIncome: number;            // Second earner's annual gross income
}

// =============================================================================
// Rent Scenario
// =============================================================================

export interface RentScenario {
  monthlyRent: number;
  annualRentIncrease: number;         // % increase per year (default: 3%)
  rentersInsurance: number;           // Monthly (default: $30)
}

// =============================================================================
// Mortgage Acceleration
// =============================================================================

export interface PeriodicPayment {
  id: string;
  year: number;
  amount: number;
}

export interface MortgageAcceleration {
  extraMonthlyPayment: number;
  annualLumpSum: number;
  annualLumpSumStartYear: number;
  annualLumpSumEndYear?: number;
  periodicPayments: PeriodicPayment[];
}

// =============================================================================
// Buy Scenario
// =============================================================================

export interface BuyScenario {
  name: string;                       // "Downtown Condo", "Suburban House"

  // Property Details
  purchasePrice: number;
  downPaymentPercent: number;         // 5-100%

  // Closing Costs (simplified)
  closingCostPercent?: number;        // % of purchase price (default: 3%)
  closingCostFlat?: number;           // Flat dollar amount (alternative)

  // Mortgage Configuration
  interestRate: number;               // Current rate
  amortizationYears: number;          // 15, 20, 25, or 30

  // Renewal Assumption (simplified)
  renewalRateAssumption?: number;     // Expected rate at renewal (default: same as current)

  // Mortgage Insurance (if applicable)
  mortgageInsurancePercent: number;   // % of loan amount (0 if 20%+ down, ~2-4% otherwise)

  // Ongoing Costs
  monthlyPropertyTax: number;
  monthlyHomeInsurance: number;
  monthlyStrataFees: number;          // Condo/HOA fees (0 if not applicable)
  monthlyUtilities: number;
  monthlyMaintenance: number;         // Typically 1% of home value / 12

  // Appreciation
  annualAppreciation: number;         // % (default: 3%)

  // Mortgage Acceleration (optional)
  acceleration?: MortgageAcceleration;
}

// =============================================================================
// Life Events
// =============================================================================

export type LifeEventType = 'one-time' | 'ongoing' | 'phase' | 'income-change';

export interface LifeEvent {
  id: string;
  description: string;                // "Child", "Promotion", "Car Purchase"
  type: LifeEventType;

  // For one-time events
  year?: number;                      // Which year does this occur
  amount?: number;                    // $ value (negative = expense)

  // For ongoing events (permanent change)
  startYear?: number;
  monthlyAmount?: number;             // $ change per month

  // For phase-based events (temporary)
  endYear?: number;                   // When does it stop

  // For income changes
  newAnnualIncome?: number;           // New income level
  percentChange?: number;             // +15% = promotion

  // For income change duration (P2: Phase income changes)
  incomeChangeDuration?: 'ongoing' | 'phase';  // ongoing (permanent) or phase (temporary)
  incomeMultiplier?: number;          // For phase: 0.5 = 50% of normal income

  // For dual income households - which earner is affected
  affectedEarner?: 'primary' | 'secondary';  // Default: 'primary'
}

// =============================================================================
// Cash Flow Categories
// =============================================================================

export interface CashFlowBreakdown {
  income: number;
  toRent: number;
  toMortgageInterest: number;
  toMortgagePrincipal: number;
  toPropertyTax: number;
  toInsurance: number;
  toMaintenance: number;
  toStrata: number;
  toUtilities: number;
  toOtherExpenses: number;
  toLifeEvents: number;       // Annual outflows from one-time expenses + recurring life-event expenses
  fromLifeEvents: number;     // Annual inflows from windfalls/inheritance + recurring life-event income
  toInvestments: number;
}

// =============================================================================
// Projection Results
// =============================================================================

export interface YearlySnapshot {
  year: number;                       // 0 = initial state, 1+ = end of year

  // Income & Expenses
  annualIncome: number;               // Net (after-tax) when includeTaxes; otherwise gross
  annualGrossIncome: number;          // Always gross household income (used for ratios e.g. 28%/35%)
  monthlyHousingCost: number;
  monthlyNonHousingExpenses: number;
  monthlyLifeEventAdjustment: number;
  monthlyDiscretionary: number;
  monthlySavings: number;

  // Wealth Components
  investmentPortfolio: number;
  nonInvestedSavingsBalance: number;  // Cumulative non-invested savings (HISA/emergency fund)
  homeValue: number;                  // 0 for rent scenario
  mortgageBalance: number;            // 0 for rent scenario
  homeEquity: number;                 // homeValue - mortgageBalance

  // Totals
  netWorth: number;                   // portfolio + nonInvestedSavings + equity

  // Cash Flow Categories (for Sankey)
  cashFlow: CashFlowBreakdown;
}

export interface ProjectionResult {
  scenario: 'rent' | 'buy';
  snapshots: YearlySnapshot[];        // Year 0 through Year N
}

// =============================================================================
// Breakeven Results
// =============================================================================

export interface TimeBreakeven {
  year: number;
  month: number;
  exact: number;                      // Fractional year (e.g., 8.5)
}

export interface BreakevenResult {
  timeBreakeven: TimeBreakeven | null; // null if never breaks even
  secondCrossover: TimeBreakeven | null; // null if trajectories don't cross back
  rentBreakeven: number | null;        // Monthly rent that equals buying
}

// =============================================================================
// Sensitivity Analysis
// =============================================================================

export interface SensitivityScenario {
  change: number;                     // e.g., -2, -1, 0, +1, +2
  newValue: number;                   // e.g., 5% becomes 7%
  breakevenYear: number | null;
  netWorthDelta: number;              // vs base case at horizon
}

export interface SensitivityResult {
  variable: string;
  baseValue: number;
  scenarios: SensitivityScenario[];
}

// =============================================================================
// Amortization
// =============================================================================

export interface AmortizationPayment {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface YearlyAmortization {
  year: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  endingBalance: number;
}

// =============================================================================
// Helper Types
// =============================================================================

export interface LifeEventImpact {
  oneTimeExpenses: number;            // Sum of |amount| for negative one-time events
  oneTimeIncome: number;              // Sum of amount for positive one-time events (windfalls, inheritance)
  monthlyAdjustment: number;          // Signed monthly delta: negative = expense, positive = income
  incomeOverride: number | null;
  incomePercentChange: number | null;
  incomeMultiplier: number | null;    // For phase-based income changes (e.g., 0.5 = 50%)
  // For dual income - track impacts per earner
  primaryIncomeMultiplier: number | null;
  secondaryIncomeMultiplier: number | null;
  primaryIncomeOverride: number | null;
  secondaryIncomeOverride: number | null;
  primaryIncomePercentChange: number | null;
  secondaryIncomePercentChange: number | null;
}

// =============================================================================
// Feasibility Warnings
// =============================================================================

export type FeasibilityWarningType =
  | 'negative_discretionary'
  | 'insufficient_savings'
  | 'mortgage_stress';

export type FeasibilityWarningSeverity = 'warning' | 'critical';

export interface FeasibilityWarning {
  type: FeasibilityWarningType;
  year: number;
  endYear?: number;                   // For aggregated warnings spanning multiple years
  severity: FeasibilityWarningSeverity;
  message: string;
  scenario: 'rent' | 'buy';
  valueRange?: string;                // For displaying ranges like "36-38%"
}
