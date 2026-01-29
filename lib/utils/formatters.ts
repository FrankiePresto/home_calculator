/**
 * Formatting utilities for the Home Purchase Analyzer
 */

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a year count with optional month precision
 */
export function formatYears(
  years: number,
  includeMonths: boolean = true
): string {
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);

  if (!includeMonths || months === 0) {
    return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}`;
  }

  if (wholeYears === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}

/**
 * Format a breakeven result for display
 */
export function formatBreakeven(
  breakeven: { year: number; month: number; exact: number } | null
): string {
  if (breakeven === null) {
    return 'Never (within timeframe)';
  }

  return formatYears(breakeven.exact, true);
}

/**
 * Format a currency difference with +/- sign
 */
export function formatCurrencyDiff(value: number, decimals: number = 0): string {
  const formatted = formatCurrency(Math.abs(value), decimals);
  if (value > 0) {
    return `+${formatted}`;
  } else if (value < 0) {
    return `-${formatted.replace('-', '')}`;
  }
  return formatted;
}

/**
 * Format a large currency value in compact form (e.g., $1.5M)
 */
export function formatCurrencyCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

/**
 * Parse a currency string to a number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse a percentage string to a number
 */
export function parsePercent(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
