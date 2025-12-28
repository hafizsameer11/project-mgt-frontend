/**
 * Format a number as PKR currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "PKR 1,000")
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }
  return `PKR ${amount.toLocaleString()}`;
}

/**
 * Format a number as PKR currency with decimals
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "PKR 1,000.00")
 */
export function formatCurrencyWithDecimals(amount: number | null | undefined, decimals: number = 2): string {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }
  return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

