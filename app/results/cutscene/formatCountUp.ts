import { formatPoints } from "@/lib/utils";

/**
 * Text for a points count-up frame. Whole-number totals (driver scores) count
 * in whole numbers; fractional totals (constructor scores, e.g. 22.67) count
 * with up to 2 decimals so the final number matches the standings exactly.
 */
export function formatCountUp(value: number, target: number): string {
  return Number.isInteger(target) ? Math.round(value).toLocaleString() : formatPoints(Math.round(value * 100) / 100);
}
