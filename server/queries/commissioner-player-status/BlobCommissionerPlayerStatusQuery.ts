import { z } from "zod";
import { blob } from "@/lib/blob";
import { motorsportRacesPath, predictionsPath } from "@/lib/paths";
import { NotFoundError } from "@/server/domain/errors";
import { assertLeagueCommissioner } from "@/server/roles/league";
import type { ILeagueRepository } from "@/server/repositories/league/ILeagueRepository";
import type { IUserRepository } from "@/server/repositories/user/IUserRepository";
import type {
  ICommissionerPlayerStatusQuery,
  CommissionerPlayerStatusResult,
} from "./ICommissionerPlayerStatusQuery";

const RaceReadSchema = z.object({
  id: z.string(),
  lockTime: z.string().optional(),
});

const PredictionsReadSchema = z.object({
  predictions: z.record(z.string(), z.array(z.string())),
  submittedAt: z.record(z.string(), z.string()).optional(),
});

export class BlobCommissionerPlayerStatusQuery implements ICommissionerPlayerStatusQuery {
  constructor(
    private readonly leagues: ILeagueRepository,
    private readonly users: IUserRepository,
  ) {}

  async execute(leagueId: string, raceId: string, actorUserId: string): Promise<CommissionerPlayerStatusResult> {
    const league = await this.leagues.findById(leagueId);
    if (!league) throw new NotFoundError("League", leagueId);
    assertLeagueCommissioner(actorUserId, league);

    // Roster comes straight off the loaded league entity (members minus the
    // owning commissioner), matching what the members query exposes — but
    // without its owner-only assert, since submission status is commissioner-level.
    const memberIds = league.memberIds.filter((id) => id !== league.commissionerId);
    const [rawRaces, rawPredictions, users] = await Promise.all([
      blob.read<unknown>(motorsportRacesPath(league.motorsportId)),
      blob.read<unknown>(predictionsPath(leagueId, raceId)),
      memberIds.length > 0 ? this.users.findByIds([...memberIds]) : Promise.resolve([]),
    ]);
    const nameById = new Map(users.map((u) => [u.userId, u.name]));
    const memberList = memberIds.map((id) => ({ id, name: nameById.get(id) ?? "Unknown" }));

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
