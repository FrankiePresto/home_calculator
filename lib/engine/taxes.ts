/**
 * Canadian Income Tax Calculator (2026)
 *
 * Calculates federal and provincial taxes based on 2026 tax brackets.
 * Sources:
 * - Federal: Canada.ca
 * - Provincial: TaxTips.ca, Fidelity.ca
 */

// =============================================================================
// Types
// =============================================================================

export interface TaxBracket {
  threshold: number;
  rate: number;
}

export interface TaxResult {
  federal: number;
  provincial: number;
  total: number;
  effectiveRate: number;
  marginalRate: number;
  netIncome: number;
}

export type Province = 'BC' | 'ON' | 'AB';

// =============================================================================
// 2026 Federal Tax Brackets
// =============================================================================

const FEDERAL_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0.14 },
  { threshold: 58523, rate: 0.205 },
  { threshold: 117045, rate: 0.26 },
  { threshold: 181440, rate: 0.29 },
  { threshold: 258482, rate: 0.33 },
];

// Federal Basic Personal Amount (2026)
const FEDERAL_BPA_BASE = 16452;
const FEDERAL_BPA_CLAWBACK_START = 181440;
const FEDERAL_BPA_CLAWBACK_END = 258482;
const FEDERAL_BPA_MINIMUM = 14829;

// =============================================================================
// 2026 Provincial Tax Brackets
// =============================================================================

const BC_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0.0506 },
  { threshold: 50363, rate: 0.077 },
  { threshold: 100728, rate: 0.105 },
  { threshold: 115648, rate: 0.1229 },
  { threshold: 140430, rate: 0.147 },
  { threshold: 190405, rate: 0.168 },
  { threshold: 265545, rate: 0.205 },
];

const BC_BPA = 13620; // BC Basic Personal Amount 2026 (estimated)

const ON_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0.0505 },
  { threshold: 53891, rate: 0.0915 },
  { threshold: 107785, rate: 0.1116 },
  { threshold: 150000, rate: 0.1216 },
  { threshold: 220000, rate: 0.1316 },
];

const ON_BPA = 12399; // Ontario Basic Personal Amount 2026 (estimated)

const AB_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0.08 },
  { threshold: 61200, rate: 0.10 },
  { threshold: 154259, rate: 0.12 },
  { threshold: 185111, rate: 0.13 },
  { threshold: 246813, rate: 0.14 },
  { threshold: 370220, rate: 0.15 },
];

const AB_BPA = 22769; // Alberta Basic Personal Amount 2026

// =============================================================================
// Tax Calculation Functions
// =============================================================================

/**
 * Calculate federal Basic Personal Amount with clawback for high incomes
 */
function getFederalBPA(grossIncome: number): number {
  if (grossIncome <= FEDERAL_BPA_CLAWBACK_START) {
    return FEDERAL_BPA_BASE;
  }
  if (grossIncome >= FEDERAL_BPA_CLAWBACK_END) {
    return FEDERAL_BPA_MINIMUM;
  }

  // Linear clawback between thresholds
  const clawbackRange = FEDERAL_BPA_CLAWBACK_END - FEDERAL_BPA_CLAWBACK_START;
  const bpaRange = FEDERAL_BPA_BASE - FEDERAL_BPA_MINIMUM;
  const incomeOverThreshold = grossIncome - FEDERAL_BPA_CLAWBACK_START;
  const clawbackAmount = (incomeOverThreshold / clawbackRange) * bpaRange;

  return FEDERAL_BPA_BASE - clawbackAmount;
}

/**
 * Calculate tax using progressive brackets
 */
function calculateBracketTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let previousThreshold = 0;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const nextThreshold = brackets[i + 1]?.threshold ?? Infinity;

    if (taxableIncome <= bracket.threshold) break;

    const taxableInBracket = Math.min(taxableIncome, nextThreshold) - Math.max(previousThreshold, bracket.threshold);
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
    }

    previousThreshold = nextThreshold;
  }

  return tax;
}

/**
 * Get marginal tax rate for a given income
 */
function getMarginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome > brackets[i].threshold) {
      return brackets[i].rate;
    }
  }
  return brackets[0].rate;
}

/**
 * Calculate federal tax
 */
export function calculateFederalTax(grossIncome: number): number {
  const bpa = getFederalBPA(grossIncome);
  const taxableIncome = Math.max(0, grossIncome - bpa);
  return calculateBracketTax(taxableIncome, FEDERAL_BRACKETS);
}

/**
 * Get provincial brackets and BPA
 */
function getProvincialConfig(province: Province): { brackets: TaxBracket[]; bpa: number } {
  switch (province) {
    case 'BC':
      return { brackets: BC_BRACKETS, bpa: BC_BPA };
    case 'ON':
      return { brackets: ON_BRACKETS, bpa: ON_BPA };
    case 'AB':
      return { brackets: AB_BRACKETS, bpa: AB_BPA };
    default:
      return { brackets: ON_BRACKETS, bpa: ON_BPA }; // Default to Ontario
  }
}

/**
 * Calculate provincial tax
 */
export function calculateProvincialTax(grossIncome: number, province: Province): number {
  const { brackets, bpa } = getProvincialConfig(province);
  const taxableIncome = Math.max(0, grossIncome - bpa);
  return calculateBracketTax(taxableIncome, brackets);
}

/**
 * Calculate total tax (federal + provincial)
 */
export function calculateTotalTax(grossIncome: number, province: Province): TaxResult {
  const federal = calculateFederalTax(grossIncome);
  const provincial = calculateProvincialTax(grossIncome, province);
  const total = federal + provincial;
  const netIncome = grossIncome - total;
  const effectiveRate = grossIncome > 0 ? (total / grossIncome) * 100 : 0;

  // Calculate combined marginal rate
  const { brackets: provincialBrackets, bpa: provincialBPA } = getProvincialConfig(province);
  const federalBPA = getFederalBPA(grossIncome);
  const federalTaxableIncome = Math.max(0, grossIncome - federalBPA);
  const provincialTaxableIncome = Math.max(0, grossIncome - provincialBPA);

  const federalMarginal = getMarginalRate(federalTaxableIncome, FEDERAL_BRACKETS);
  const provincialMarginal = getMarginalRate(provincialTaxableIncome, provincialBrackets);
  const marginalRate = (federalMarginal + provincialMarginal) * 100;

  return {
    federal,
    provincial,
    total,
    effectiveRate,
    marginalRate,
    netIncome,
  };
}

/**
 * Calculate net income after taxes
 */
export function calculateNetIncome(grossIncome: number, province: Province): number {
  const { total } = calculateTotalTax(grossIncome, province);
  return grossIncome - total;
}

/**
 * Calculate household tax for dual income (taxes calculated separately, then combined)
 */
export function calculateHouseholdTax(
  primaryIncome: number,
  secondaryIncome: number,
  province: Province
): TaxResult & { primaryResult: TaxResult; secondaryResult: TaxResult } {
  const primaryResult = calculateTotalTax(primaryIncome, province);
  const secondaryResult = calculateTotalTax(secondaryIncome, province);

  const totalGross = primaryIncome + secondaryIncome;
  const federal = primaryResult.federal + secondaryResult.federal;
  const provincial = primaryResult.provincial + secondaryResult.provincial;
  const total = federal + provincial;
  const netIncome = primaryResult.netIncome + secondaryResult.netIncome;
  const effectiveRate = totalGross > 0 ? (total / totalGross) * 100 : 0;

  // Combined marginal rate is the higher of the two (for additional income)
  const marginalRate = Math.max(primaryResult.marginalRate, secondaryResult.marginalRate);

  return {
    federal,
    provincial,
    total,
    effectiveRate,
    marginalRate,
    netIncome,
    primaryResult,
    secondaryResult,
  };
}

/**
 * Get province display name
 */
export function getProvinceName(province: Province): string {
  switch (province) {
    case 'BC':
      return 'British Columbia';
    case 'ON':
      return 'Ontario';
    case 'AB':
      return 'Alberta';
    default:
      return province;
  }
}

/**
 * List of supported provinces
 */
export const SUPPORTED_PROVINCES: { value: Province; label: string }[] = [
  { value: 'BC', label: 'British Columbia' },
  { value: 'ON', label: 'Ontario' },
  { value: 'AB', label: 'Alberta' },
];
