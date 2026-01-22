/**
 * Usage calculation utilities for the monthly dashboard
 *
 * These utilities estimate subscription usage based on API cost equivalents.
 */

/**
 * Estimated maximum API equivalent for heavy usage ($400)
 * This represents what a Max subscriber might use in a very active month
 * if they were paying per-API-call instead.
 */
const ESTIMATED_MAX_EQUIVALENT = 400;

/**
 * Calculate the estimated usage percentage based on API cost equivalent
 *
 * @param estimatedApiCost - The estimated API cost in dollars
 * @returns Usage percentage (0-100, capped at 100)
 */
export function calculateUsagePercentage(estimatedApiCost: number): number {
  if (estimatedApiCost < 0) {
    return 0;
  }
  return Math.min((estimatedApiCost / ESTIMATED_MAX_EQUIVALENT) * 100, 100);
}

/**
 * Calculate the value multiplier (API cost / subscription cost)
 *
 * @param estimatedApiCost - The estimated API cost in dollars
 * @param subscriptionCost - The subscription cost (default: $100 for US)
 * @returns Value multiplier (e.g., 8.47 means 8.47x value)
 */
export function calculateValueMultiplier(
  estimatedApiCost: number,
  subscriptionCost: number = 100
): number {
  if (subscriptionCost <= 0) {
    return 0;
  }
  return estimatedApiCost / subscriptionCost;
}

/**
 * Calculate human vs AI time ratio
 *
 * @param humanTime - Human time in milliseconds
 * @param claudeTime - Claude time in milliseconds
 * @returns Object with humanPercentage and claudePercentage (0-100)
 */
export function calculateTimeRatio(
  humanTime: number,
  claudeTime: number
): { humanPercentage: number; claudePercentage: number } {
  const total = humanTime + claudeTime;

  if (total <= 0) {
    return { humanPercentage: 0, claudePercentage: 0 };
  }

  const humanPercentage = Math.round((humanTime / total) * 100);
  const claudePercentage = 100 - humanPercentage;

  return { humanPercentage, claudePercentage };
}

/**
 * Format a cost value as currency
 *
 * @param cost - Cost in dollars
 * @returns Formatted string like "$847.23"
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
}

/**
 * Format a value multiplier
 *
 * @param multiplier - Value multiplier (e.g., 8.47)
 * @returns Formatted string like "8.47x"
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(2)}x`;
}
