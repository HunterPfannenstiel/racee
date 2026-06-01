import { z } from "zod";

const LeagueRaceConfigPropsSchema = z.object({
  leagueId: z.string().uuid(),
  raceId: z.string().uuid(),
  lockTime: z.string().datetime(),
});
type LeagueRaceConfigProps = z.infer<typeof LeagueRaceConfigPropsSchema>;

export class LeagueRaceConfig {
  private props: LeagueRaceConfigProps;

  constructor(props: LeagueRaceConfigProps) {
    this.props = LeagueRaceConfigPropsSchema.parse(props);
  }

  get leagueId() { return this.props.leagueId; }
  get raceId() { return this.props.raceId; }
  get lockTime() { return this.props.lockTime; }
}
