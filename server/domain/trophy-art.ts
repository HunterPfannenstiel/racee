import { z } from "zod";

/**
 * Site-wide custom trophy pictures uploaded by the admin, one per tier. A tier
 * with no upload uses the built-in hand-drawn trophy.
 */
export const TrophyTierSchema = z.enum(["gold", "silver", "bronze"]);
export type TrophyTier = z.infer<typeof TrophyTierSchema>;

export const TrophyArtPropsSchema = z.object({
  /** "upload:<version>" per tier, or null for the built-in art. */
  gold: z.string().nullable().default(null),
  silver: z.string().nullable().default(null),
  bronze: z.string().nullable().default(null),
});
export type TrophyArtProps = z.infer<typeof TrophyArtPropsSchema>;

export class TrophyArt {
  private props: TrophyArtProps;

  static empty(): TrophyArt {
    return new TrophyArt({});
  }

  constructor(props: z.input<typeof TrophyArtPropsSchema>) {
    this.props = TrophyArtPropsSchema.parse(props);
  }

  get values(): Readonly<TrophyArtProps> { return this.props; }

  setUploaded(tier: TrophyTier, version: number): void {
    this.props = { ...this.props, [tier]: `upload:${version}` };
  }

  clear(tier: TrophyTier): void {
    this.props = { ...this.props, [tier]: null };
  }
}
