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
  toLifeEvents: number;
  toInvestments: number;
}

// =============================================================================
// Projection Results
// =============================================================================

export interface YearlySnapshot {
  year: number;                       // 0 = initial state, 1+ = end of year

  // Income & Expenses
  annualIncome: number;
  monthlyHousingCost: number;
  monthlyNonHousingExpenses: number;
  monthlyLifeEventAdjustment: number;
  monthlyDiscretionary: number;
  monthlySavings: number;

  // Wealth Components
  investmentPortfolio: number;
  homeValue: number;                  // 0 for rent scenario
  mortgageBalance: number;            // 0 for rent scenario
  homeEquity: number;                 // homeValue - mortgageBalance

  // Totals
  netWorth: number;                   // portfolio + equity

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
  oneTimeExpenses: number;
  monthlyAdjustment: number;
  incomeOverride: number | null;
  incomePercentChange: number | null;
}
