import { z } from "zod";
import { blob } from "@/lib/blob";
import { LEAGUES_PATH, motorsportRacesPath, predictionsPath } from "@/lib/paths";
import { NotFoundError } from "@/server/domain/errors";
import type { ILeagueMembersQuery } from "@/server/queries/league-members/ILeagueMembersQuery";
import type {
  ICommissionerPlayerStatusQuery,
  CommissionerPlayerStatusResult,
} from "./ICommissionerPlayerStatusQuery";

const LeagueReadSchema = z.object({
  id: z.string(),
  motorsportId: z.string().optional(),
});

const RaceReadSchema = z.object({
  id: z.string(),
  lockTime: z.string().optional(),
});

const PredictionsReadSchema = z.object({
  predictions: z.record(z.string(), z.array(z.string())),
  submittedAt: z.record(z.string(), z.string()).optional(),
});

export class BlobCommissionerPlayerStatusQuery implements ICommissionerPlayerStatusQuery {
  constructor(private readonly members: ILeagueMembersQuery) {}

  async execute(leagueId: string, raceId: string): Promise<CommissionerPlayerStatusResult> {
    const rawLeagues = await blob.read<unknown>(LEAGUES_PATH);
    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const league = leagues.find((l) => l.id === leagueId);
    if (!league?.motorsportId) throw new NotFoundError("League", leagueId);

    const [rawRaces, rawPredictions, memberList] = await Promise.all([
      blob.read<unknown>(motorsportRacesPath(league.motorsportId)),
      blob.read<unknown>(predictionsPath(leagueId, raceId)),
      this.members.execute(leagueId),
    ]);

    const races = z.array(RaceReadSchema).parse(rawRaces ?? []);
    const race = races.find((r) => r.id === raceId);
    if (!race) throw new NotFoundError("Race", raceId);

    const parsedPredictions = rawPredictions
      ? PredictionsReadSchema.safeParse(rawPredictions)
      : null;
    const predictions = parsedPredictions?.success ? parsedPredictions.data : null;

    const now = new Date();
    const locked = race.lockTime ? now >= new Date(race.lockTime) : false;

    return {
      race: { id: race.id, locked, lockTime: race.lockTime ?? null },
      members: memberList.map((m) => ({
        id: m.id,
        name: m.name,
        submittedAt: predictions?.submittedAt?.[m.id] ?? null,
      })),
    };
  }
}
