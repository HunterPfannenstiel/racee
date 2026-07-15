export type FluidFontSizeOptions = {
  /** Worst-case transform multiplier the text will be scaled by (e.g. EstablishingCardStage's BIG_SCALE). */
  maxScale: number;
  /** Design ceiling -- matches today's static Tailwind size (0.875rem for text-sm, 0.75rem for text-xs). */
  maxRem: number;
  /** Legibility floor. Defaults to 0.625rem (10px). */
  minRem?: number;
  /** Fraction of 100vw allowed at maxScale, leaving margin on each side. Defaults to 0.86. */
  targetVwFraction?: number;
  /** Heuristic average glyph+tracking width per character, in em. Defaults to 0.62. */
  avgCharWidthEm?: number;
};

/**
 * Computes a CSS `clamp()` font-size string, sized from a string's character
 * count, such that even at the animation's peak transform `scale`
 * (`maxScale`), the text can never exceed `targetVwFraction` of the viewport
 * width -- no truncation, no DOM measurement, just arithmetic on `.length`
 * resolved responsively by the browser via `vw` units at paint time.
 *
 * Used by EstablishingCardStage to keep the race name / league name from
 * overflowing narrow viewports at BIG_SCALE (see that file's `scale` motion
 * value, which only ever animates from BIG_SCALE down to 1).
 */
export function fluidClampFontSize(text: string, opts: FluidFontSizeOptions): string {
  const {
    maxScale,
    maxRem,
    minRem = 0.625,
    targetVwFraction = 0.86,
    avgCharWidthEm = 0.62,
  } = opts;
  const widthEm = Math.max(text.length, 1) * avgCharWidthEm;
  const vwBudget = (targetVwFraction * 100) / (widthEm * maxScale);
  return `clamp(${minRem}rem, ${vwBudget.toFixed(3)}vw, ${maxRem}rem)`;
}
