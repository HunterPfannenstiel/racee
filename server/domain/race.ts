import { z } from "zod";

const RacePropsSchema = z.object({
  raceId: z.string().uuid(),
  leagueId: z.string().uuid(),
  title: z.string().min(1),
  label: z.string().optional(),
  date: z.string().min(1),
  lockTime: z.string().datetime().optional(),
  startingGrid: z.array(z.string().uuid()),
});
type RaceProps = z.infer<typeof RacePropsSchema>;

export class Race {
  private props: RaceProps;

  constructor(props: RaceProps) {
    this.props = RacePropsSchema.parse(props);
  }

  get raceId() { return this.props.raceId; }
  get leagueId() { return this.props.leagueId; }
  get title() { return this.props.title; }
  get label() { return this.props.label; }
  get date() { return this.props.date; }
  get lockTime() { return this.props.lockTime; }
  get startingGrid(): readonly string[] { return this.props.startingGrid; }

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
}
