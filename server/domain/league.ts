import { z } from "zod";

const PropPointValuesSchema = z.object({
  driverOfDay: z.number().int().min(0),
  lapsLed: z.number().int().min(0),
  fastestPitStop: z.number().int().min(0),
  fastestLap: z.number().int().min(0),
  overAchiever: z.number().int().min(0),
  underAchiever: z.number().int().min(0),
  wrecker: z.number().int().min(0),
});
export type PropPointValues = z.infer<typeof PropPointValuesSchema>;

const LeaguePropsSchema = z.object({
  leagueId: z.string().uuid(),
  commissionerId: z.string(),
  name: z.string().min(1),
  placementPoints: z.array(z.number().int().min(0)),
  mulliganCount: z.number().int().min(0),
  scoringDepth: z.number().int().min(1).optional(),
  stageCount: z.number().int().min(0).optional(),
  propPointValues: PropPointValuesSchema,
  motorsportId: z.string().uuid(),
  teamPositionPoints: z.array(z.number().min(0)).optional(),
});


type LeagueProps = z.infer<typeof LeaguePropsSchema>;

export class League {
  private props: LeagueProps;

  constructor(props: LeagueProps) {
    this.props = LeaguePropsSchema.parse(props);
  }

  get leagueId() { return this.props.leagueId; }
  get commissionerId() { return this.props.commissionerId; }
  get name() { return this.props.name; }
  get placementPoints(): readonly number[] { return this.props.placementPoints; }
  get mulliganCount() { return this.props.mulliganCount; }
  get scoringDepth() { return this.props.scoringDepth; }  // undefined means score all positions
  get stageCount() { return this.props.stageCount; }
  get propPointValues(): PropPointValues { return this.props.propPointValues; }
  get motorsportId() { return this.props.motorsportId; }
  get teamPositionPoints(): readonly number[] | undefined { return this.props.teamPositionPoints; }

  rename(name: string): void {
    this.props = LeaguePropsSchema.parse({ ...this.props, name });
  }

  updateScoringConfig(patch: Partial<Omit<LeagueProps, "leagueId" | "name">>): void {
    this.props = LeaguePropsSchema.parse({ ...this.props, ...patch });
  }
}
