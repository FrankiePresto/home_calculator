/**
 * Investment calculations for the Home Purchase Analyzer
 *
 * Handles compound growth with regular contributions
 */

/**
 * Grow an investment portfolio over time with monthly contributions
 * Applies compound interest monthly
 *
 * @param startingBalance - Initial portfolio value
 * @param monthlyContribution - Amount added each month
 * @param annualReturnPercent - Annual return rate as percentage (e.g., 7 for 7%)
 * @param months - Number of months to grow (default: 12)
 * @returns Final portfolio balance
 */
export function growPortfolio(
  startingBalance: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  months: number = 12
): number {
  const monthlyRate = annualReturnPercent / 100 / 12;
  let balance = startingBalance;

  for (let month = 0; month < months; month++) {
    // Add contribution first, then apply growth
    balance += monthlyContribution;
    balance *= 1 + monthlyRate;
  }

  return balance;
}

/**
 * Calculate the future value of a single lump sum investment
 *
 * @param principal - Initial investment amount
 * @param annualReturnPercent - Annual return rate as percentage
 * @param years - Investment horizon in years
 * @returns Future value of investment
 */
export function calculateFutureValue(
  principal: number,
  annualReturnPercent: number,
  years: number
): number {
  if (years <= 0 || principal <= 0) {
    return principal;
  }

  const rate = annualReturnPercent / 100;
  return principal * Math.pow(1 + rate, years);
}

/**
 * Calculate the future value with regular monthly contributions
 *
 * @param principal - Initial investment amount
 * @param monthlyContribution - Regular monthly addition
 * @param annualReturnPercent - Annual return rate as percentage
 * @param years - Investment horizon in years
 * @returns Future value including contributions and growth
 */
export function calculateFutureValueWithContributions(
  principal: number,
  monthlyContribution: number,
  annualReturnPercent: number,
  years: number
): number {
  return growPortfolio(
    principal,
    monthlyContribution,
    annualReturnPercent,
    years * 12
  );
}

/**
 * Calculate how much a portfolio would grow in one year
 *
 * @param startingBalance - Portfolio value at start of year
 * @param monthlyContribution - Regular monthly addition
 * @param annualReturnPercent - Annual return rate as percentage
 * @returns Growth amount (ending balance - starting balance - contributions)
 */
export function calculateYearlyGrowth(
  startingBalance: number,
  monthlyContribution: number,
  annualReturnPercent: number
): number {
  const endingBalance = growPortfolio(
    startingBalance,
    monthlyContribution,
    annualReturnPercent,
    12
  );
  const totalContributions = monthlyContribution * 12;

  return endingBalance - startingBalance - totalContributions;
}

/**
 * Calculate the opportunity cost of withdrawing funds for a down payment
 *
 * @param withdrawalAmount - Amount withdrawn from investments
 * @param annualReturnPercent - Expected annual return
 * @param years - Investment horizon
 * @returns The potential growth that was foregone
 */
export function calculateOpportunityCost(
  withdrawalAmount: number,
  annualReturnPercent: number,
  years: number
): number {
  const potentialValue = calculateFutureValue(
    withdrawalAmount,
    annualReturnPercent,
    years
  );
  return potentialValue - withdrawalAmount;
}

/**
 * Calculate the effective annual return given monthly returns
 *
 * @param monthlyReturnPercent - Monthly return rate as percentage
 * @returns Effective annual return percentage
 */
export function monthlyToAnnualReturn(monthlyReturnPercent: number): number {
  const monthlyRate = monthlyReturnPercent / 100;
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
}

/**
 * Calculate the monthly return needed to achieve an annual target
 *
 * @param annualReturnPercent - Target annual return as percentage
 * @returns Required monthly return percentage
 */
export function annualToMonthlyReturn(annualReturnPercent: number): number {
  const annualRate = annualReturnPercent / 100;
  return (Math.pow(1 + annualRate, 1 / 12) - 1) * 100;
}
