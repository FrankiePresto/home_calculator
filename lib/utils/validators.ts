/**
 * Input validation utilities for the Home Purchase Analyzer
 */

import {
  FinancialProfile,
  RentScenario,
  BuyScenario,
  LifeEvent,
} from '../engine/types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a currency value
 */
export function validateCurrency(
  value: number,
  field: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): ValidationError | null {
  const { min = 0, max = Infinity, required = true } = options;

  if (required && (value === undefined || value === null || isNaN(value))) {
    return { field, message: `${field} is required` };
  }

  if (value < min) {
    return { field, message: `${field} must be at least ${min}` };
  }

  if (value > max) {
    return { field, message: `${field} must be at most ${max}` };
  }

  return null;
}

/**
 * Validate a percentage value
 */
export function validatePercent(
  value: number,
  field: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): ValidationError | null {
  const { min = 0, max = 100, required = true } = options;

  if (required && (value === undefined || value === null || isNaN(value))) {
    return { field, message: `${field} is required` };
  }

  if (value < min) {
    return { field, message: `${field} must be at least ${min}%` };
  }

  if (value > max) {
    return { field, message: `${field} must be at most ${max}%` };
  }

  return null;
}

/**
 * Validate a Financial Profile
 */
export function validateFinancialProfile(
  profile: Partial<FinancialProfile>
): ValidationResult {
  const errors: ValidationError[] = [];

  const incomeError = validateCurrency(
    profile.annualGrossIncome ?? 0,
    'Annual Gross Income',
    { min: 1 }
  );
  if (incomeError) errors.push(incomeError);

  // For dual-income households, secondary income must be a valid non-negative number
  if (profile.incomeType === 'dual') {
    const secondaryError = validateCurrency(
      profile.secondaryIncome ?? 0,
      'Secondary Income',
      { min: 0 }
    );
    if (secondaryError) errors.push(secondaryError);
  }

  const expensesError = validateCurrency(
    profile.monthlyNonHousingExpenses ?? 0,
    'Monthly Non-Housing Expenses',
    { min: 0 }
  );
  if (expensesError) errors.push(expensesError);

  const portfolioError = validateCurrency(
    profile.currentInvestmentPortfolio ?? 0,
    'Current Investment Portfolio',
    { min: 0, required: false }
  );
  if (portfolioError) errors.push(portfolioError);

  const returnError = validatePercent(
    profile.expectedInvestmentReturn ?? 7,
    'Expected Investment Return',
    { min: 0, max: 15 }
  );
  if (returnError) errors.push(returnError);

  const savingsError = validatePercent(
    profile.savingsRate ?? 50,
    'Savings Rate',
    { min: 0, max: 100 }
  );
  if (savingsError) errors.push(savingsError);

  const raiseError = validatePercent(
    profile.annualRaisePercent ?? 2,
    'Annual Raise',
    { min: 0, max: 10 }
  );
  if (raiseError) errors.push(raiseError);

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a Rent Scenario
 */
export function validateRentScenario(
  scenario: Partial<RentScenario>
): ValidationResult {
  const errors: ValidationError[] = [];

  const rentError = validateCurrency(
    scenario.monthlyRent ?? 0,
    'Monthly Rent',
    { min: 1 }
  );
  if (rentError) errors.push(rentError);

  const increaseError = validatePercent(
    scenario.annualRentIncrease ?? 3,
    'Annual Rent Increase',
    { min: 0, max: 10 }
  );
  if (increaseError) errors.push(increaseError);

  const insuranceError = validateCurrency(
    scenario.rentersInsurance ?? 30,
    "Renter's Insurance",
    { min: 0, required: false }
  );
  if (insuranceError) errors.push(insuranceError);

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a Buy Scenario
 */
export function validateBuyScenario(
  scenario: Partial<BuyScenario>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Property Details
  const priceError = validateCurrency(
    scenario.purchasePrice ?? 0,
    'Purchase Price',
    { min: 1 }
  );
  if (priceError) errors.push(priceError);

  const downPaymentError = validatePercent(
    scenario.downPaymentPercent ?? 20,
    'Down Payment',
    { min: 5, max: 100 }
  );
  if (downPaymentError) errors.push(downPaymentError);

  // Mortgage
  const rateError = validatePercent(
    scenario.interestRate ?? 5,
    'Interest Rate',
    { min: 0, max: 15 }
  );
  if (rateError) errors.push(rateError);

  const amortizationYears = scenario.amortizationYears ?? 25;
  if (![15, 20, 25, 30].includes(amortizationYears)) {
    errors.push({
      field: 'Amortization',
      message: 'Amortization must be 15, 20, 25, or 30 years',
    });
  }

  // Closing Costs
  if (scenario.closingCostPercent !== undefined) {
    const closingError = validatePercent(
      scenario.closingCostPercent,
      'Closing Costs',
      { min: 0, max: 10 }
    );
    if (closingError) errors.push(closingError);
  }

  // Mortgage Insurance
  const mortgageInsuranceError = validatePercent(
    scenario.mortgageInsurancePercent ?? 0,
    'Mortgage Insurance',
    { min: 0, max: 5 }
  );
  if (mortgageInsuranceError) errors.push(mortgageInsuranceError);

  // Ongoing Costs
  const taxError = validateCurrency(
    scenario.monthlyPropertyTax ?? 0,
    'Monthly Property Tax',
    { min: 0 }
  );
  if (taxError) errors.push(taxError);

  const homeInsuranceError = validateCurrency(
    scenario.monthlyHomeInsurance ?? 150,
    'Monthly Home Insurance',
    { min: 0 }
  );
  if (homeInsuranceError) errors.push(homeInsuranceError);

  const strataError = validateCurrency(
    scenario.monthlyStrataFees ?? 0,
    'Monthly Strata/HOA Fees',
    { min: 0, required: false }
  );
  if (strataError) errors.push(strataError);

  const utilitiesError = validateCurrency(
    scenario.monthlyUtilities ?? 200,
    'Monthly Utilities',
    { min: 0 }
  );
  if (utilitiesError) errors.push(utilitiesError);

  const maintenanceError = validateCurrency(
    scenario.monthlyMaintenance ?? 0,
    'Monthly Maintenance',
    { min: 0 }
  );
  if (maintenanceError) errors.push(maintenanceError);

  // Appreciation
  const appreciationError = validatePercent(
    scenario.annualAppreciation ?? 3,
    'Annual Appreciation',
    { min: -5, max: 10 }
  );
  if (appreciationError) errors.push(appreciationError);

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a Life Event
 */
export function validateLifeEvent(event: Partial<LifeEvent>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!event.description || event.description.trim() === '') {
    errors.push({ field: 'Description', message: 'Description is required' });
  }

  if (!event.type) {
    errors.push({ field: 'Type', message: 'Event type is required' });
  }

  switch (event.type) {
    case 'one-time':
      if (event.year === undefined || event.year < 1 || event.year > 40) {
        errors.push({ field: 'Year', message: 'Year must be between 1 and 40' });
      }
      if (event.amount === undefined) {
        errors.push({ field: 'Amount', message: 'Amount is required' });
      }
      break;

    case 'ongoing':
      if (event.startYear === undefined || event.startYear < 1 || event.startYear > 40) {
        errors.push({ field: 'Start Year', message: 'Start year must be between 1 and 40' });
      }
      if (event.monthlyAmount === undefined) {
        errors.push({ field: 'Monthly Amount', message: 'Monthly amount is required' });
      }
      break;

    case 'phase':
      if (event.startYear === undefined || event.startYear < 1 || event.startYear > 40) {
        errors.push({ field: 'Start Year', message: 'Start year must be between 1 and 40' });
      }
      if (event.endYear === undefined || event.endYear < 1 || event.endYear > 40) {
        errors.push({ field: 'End Year', message: 'End year must be between 1 and 40' });
      }
      if (event.startYear && event.endYear && event.endYear <= event.startYear) {
        errors.push({ field: 'End Year', message: 'End year must be after start year' });
      }
      if (event.monthlyAmount === undefined) {
        errors.push({ field: 'Monthly Amount', message: 'Monthly amount is required' });
      }
      break;

    case 'income-change':
      if (event.year === undefined || event.year < 1 || event.year > 40) {
        errors.push({ field: 'Year', message: 'Year must be between 1 and 40' });
      }
      if (event.newAnnualIncome === undefined && event.percentChange === undefined) {
        errors.push({
          field: 'Income',
          message: 'Either new income or percent change is required',
        });
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if portfolio can cover down payment and closing costs
 */
export function canAffordDownPayment(
  portfolio: number,
  purchasePrice: number,
  downPaymentPercent: number,
  closingCostPercent: number = 3
): boolean {
  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const closingCosts = purchasePrice * (closingCostPercent / 100);
  return portfolio >= downPayment + closingCosts;
}
