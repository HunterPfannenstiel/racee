import { z } from "zod";
import { InvariantViolationError } from "./errors";
import { PropKeySchema, type PropKey } from "./race-prediction-book";

export const RacePropsSchema = z.object({
  raceId: z.string().uuid(),
  motorsportId: z.string().uuid(),
  title: z.string().min(1),
  label: z.string().optional(),
  date: z.string().min(1),
  lockTime: z.string().datetime().optional(),
  startingGrid: z.array(z.string().uuid()),
  keyOrder: z.array(z.string().uuid()).nullable().default(null),
  propKey: PropKeySchema.nullable().default(null),
  keySetAt: z.string().nullable().default(null),
  /** Cancelled races stay on the calendar (and in their stage) but are never predicted or graded. */
  cancelled: z.boolean().default(false),
  /** A replacement race takes the calendar slot (and stage) of the cancelled race it replaces. */
  replacesRaceId: z.string().uuid().nullable().default(null),
});
export type RaceProps = z.infer<typeof RacePropsSchema>;

export class Race {
  private props: RaceProps;

  constructor(props: z.input<typeof RacePropsSchema>) {
    this.props = RacePropsSchema.parse(props);
  }

  get raceId() { return this.props.raceId; }
  get motorsportId() { return this.props.motorsportId; }
  get title() { return this.props.title; }
  get label() { return this.props.label; }
  get date() { return this.props.date; }
  get lockTime() { return this.props.lockTime; }
  get startingGrid(): readonly string[] { return this.props.startingGrid; }
  get keyOrder(): readonly string[] | null { return this.props.keyOrder; }
  get propKey(): PropKey | null { return this.props.propKey; }
  get keySetAt(): string | null { return this.props.keySetAt; }
  get cancelled(): boolean { return this.props.cancelled; }
  get replacesRaceId(): string | null { return this.props.replacesRaceId; }

  isLocked(now: Date): boolean {
    if (!this.props.lockTime) return false;
    return now >= new Date(this.props.lockTime);
  }

  setStartingGrid(racerIds: string[]): void {
    if (racerIds.length === 0) throw new Error("Race: startingGrid cannot be empty");
    if (new Set(racerIds).size !== racerIds.length) throw new Error("Race: startingGrid contains duplicates");
    this.props = RacePropsSchema.parse({ ...this.props, startingGrid: racerIds });
  }

  updateDetails(patch: Partial<Pick<RaceProps, "title" | "label" | "date" | "lockTime" | "cancelled" | "replacesRaceId">>): void {
    if (patch.replacesRaceId && patch.replacesRaceId === this.props.raceId) {
      throw new InvariantViolationError("A race cannot replace itself");
    }
    if (patch.cancelled && !this.props.cancelled && this.props.keySetAt !== null) {
      throw new InvariantViolationError("This race already has results, so it can't be cancelled");
    }
    this.props = RacePropsSchema.parse({ ...this.props, ...patch });
  }

  setKey(keyOrder: string[], propKey: PropKey, now: string): void {
    if (keyOrder.length === 0) throw new Error("Race: keyOrder cannot be empty");
    if (this.props.cancelled) throw new Error("Race: cannot enter results for a cancelled race");
    this.props = RacePropsSchema.parse({ ...this.props, keyOrder, propKey, keySetAt: now });
  }
}

/**
 * Checks every replacement link in a season. One level only: a replacement must
 * point at a cancelled race in the same season that isn't itself a replacement,
 * each cancelled race can have at most one replacement, and a replacement can't
 * itself be cancelled.
 */
export function assertValidReplacements(season: readonly Race[]): void {
  const byId = new Map(season.map(r => [r.raceId, r]));
  const claimed = new Map<string, Race>();
  for (const race of season) {
    const targetId = race.replacesRaceId;
    if (!targetId) continue;
    const target = byId.get(targetId);
    if (!target) throw new InvariantViolationError(`${race.title} replaces a race that doesn't exist in this season`);
    if (target.raceId === race.raceId) throw new InvariantViolationError("A race cannot replace itself");
    if (!target.cancelled) throw new InvariantViolationError(`${target.title} must be marked cancelled before it can be replaced`);
    if (target.replacesRaceId) throw new InvariantViolationError(`${target.title} is itself a replacement and can't be replaced`);
    if (race.cancelled) throw new InvariantViolationError(`${race.title} is cancelled, so it can't be a replacement`);
    const other = claimed.get(targetId);
    if (other) throw new InvariantViolationError(`${target.title} is already replaced by ${other.title}`);
    claimed.set(targetId, race);
  }
}
