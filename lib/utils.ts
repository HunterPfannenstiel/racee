import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a points value for display, capped at 2 decimal places (fractional team splits otherwise bleed out to 15+ digits). */
export function formatPoints(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
