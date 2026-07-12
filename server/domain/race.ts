import { z } from "zod";
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

  isLocked(now: Date): boolean {
    if (!this.props.lockTime) return false;
    return now >= new Date(this.props.lockTime);
  }

  setStartingGrid(racerIds: string[]): void {
    if (racerIds.length === 0) throw new Error("Race: startingGrid cannot be empty");
    if (new Set(racerIds).size !== racerIds.length) throw new Error("Race: startingGrid contains duplicates");
    this.props = RacePropsSchema.parse({ ...this.props, startingGrid: racerIds });
  }

  updateDetails(patch: Partial<Pick<RaceProps, "title" | "label" | "date" | "lockTime">>): void {
    this.props = RacePropsSchema.parse({ ...this.props, ...patch });
  }

  setKey(keyOrder: string[], propKey: PropKey, now: string): void {
    if (keyOrder.length === 0) throw new Error("Race: keyOrder cannot be empty");
    this.props = RacePropsSchema.parse({ ...this.props, keyOrder, propKey, keySetAt: now });
  }
}
