import { z } from "zod";
import { blob } from "@/lib/blob";
import {
  LEAGUES_PATH,
  RACERS_PATH,
  motorsportRacesPath,
  predictionsPath,
  teamsPath,
} from "@/lib/paths";
import { prisma } from "@/server/db";
import type {
  IUserOpenRacesQuery,
  UserOpenRacesResult,
  OpenRaceDTO,
  RacerDTO,
  MyPickDTO,
  TeammateDTO,
} from "./IUserOpenRacesQuery";

// ─── Lightweight read schemas ─────────────────────────────────────────────────

const LeagueReadSchema = z.object({
  id: z.string(),
  motorsportId: z.string().optional(),
});

const RaceReadSchema = z.object({
  id: z.string(),
  motorsportId: z.string(),
  title: z.string(),
  label: z.string().optional(),
  date: z.string(),
  lockTime: z.string().optional(),
  startingGrid: z.array(z.string()),
  keySetAt: z.string().nullable().default(null),
});

const RacerReadSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  image: z.string().optional(),
  teamColor: z.string().optional(),
});

const PropPicksReadSchema = z.object({
  driverOfDay: z.string().optional(),
  lapsLed: z.string().optional(),
  fastestPitStop: z.string().optional(),
  fastestLap: z.string().optional(),
  overAchiever: z.string().optional(),
  underAchiever: z.string().optional(),
  wrecker: z.string().optional(),
});

const PredictionsReadSchema = z.object({
  predictions: z.record(z.string(), z.array(z.string())),
  submittedAt: z.record(z.string(), z.string()).optional(),
  submittedBy: z.record(z.string(), z.string()).optional(),
  propPicks: z.record(z.string(), PropPicksReadSchema).optional(),
});

const TeamReadSchema = z.object({
  id: z.string(),
  name: z.string(),
  memberIds: z.array(z.string()),
  color: z.string().optional(),
});

// ─── Implementation ───────────────────────────────────────────────────────────

export class BlobUserOpenRacesQuery implements IUserOpenRacesQuery {
  async execute(userId: string, leagueId: string): Promise<UserOpenRacesResult> {
    const now = new Date();

    // Round 1: leagues + racers + teams in parallel
    const [rawLeagues, rawRacers, rawTeams] = await Promise.all([
      blob.read<unknown>(LEAGUES_PATH),
      blob.read<unknown>(RACERS_PATH),
      blob.read<unknown>(teamsPath(leagueId)),
    ]);

    const leagues = z.array(LeagueReadSchema).parse(rawLeagues ?? []);
    const allRacers = z.array(RacerReadSchema).parse(rawRacers ?? []);
    const teams = z.array(TeamReadSchema).parse(rawTeams ?? []);

    const league = leagues.find((l) => l.id === leagueId);
    if (!league?.motorsportId) {
      return { openRaces: [], racersById: {}, teammates: [], teammatePicks: {} };
    }

    // Resolve team membership
    const userTeam = teams.find((t) => t.memberIds.includes(userId));
    const teammateIds = userTeam
      ? userTeam.memberIds.filter((id) => id !== userId)
      : [];
    const teamColor = userTeam?.color;

    // Round 2: races + teammate names in parallel
    const [rawRaces, teammateUsers] = await Promise.all([
      blob.read<unknown>(motorsportRacesPath(league.motorsportId)),
      teammateIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: teammateIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const races = z.array(RaceReadSchema).parse(rawRaces ?? []);
    const userNameMap = new Map(teammateUsers.map((u) => [u.id, u.name]));

    const teammates: TeammateDTO[] = teammateIds
      .map((id) => ({ id, name: userNameMap.get(id) ?? id }));

    // Filter to open races
    type OpenEntry = { race: z.infer<typeof RaceReadSchema>; leagueId: string };
    const openEntries: OpenEntry[] = [];

    for (const race of races) {
      if (
        race.startingGrid.length > 0 &&
        (!race.lockTime || now < new Date(race.lockTime)) &&
        race.keySetAt === null
      ) {
        openEntries.push({ race, leagueId });
      }
    }

    // Round 3: prediction blobs for open races in parallel
    const rawPredictions = await Promise.all(
      openEntries.map(({ race, leagueId }) =>
        blob.read<unknown>(predictionsPath(leagueId, race.id)),
      ),
    );

    // Build a name resolver for submittedBy (includes current user + teammates)
    const allRelevantIds = [userId, ...teammateIds];
    const resolveSubmitterName = (submitterId: string | undefined): string | null => {
      if (!submitterId) return null;
      if (!allRelevantIds.includes(submitterId)) return submitterId;
      if (submitterId === userId) return null;
      return userNameMap.get(submitterId) ?? submitterId;
    };

    const buildPickDTO = (
      preds: z.infer<typeof PredictionsReadSchema> | null,
      targetUserId: string,
    ): MyPickDTO | null => {
      if (!preds?.predictions[targetUserId]) return null;
      const rawSubmitter = preds.submittedBy?.[targetUserId];
      return {
        racerIds: preds.predictions[targetUserId],
        propPicks: preds.propPicks?.[targetUserId] ?? {},
        submittedAt: preds.submittedAt?.[targetUserId] ?? null,
        submittedBy: rawSubmitter ?? null,
        submittedByName: resolveSubmitterName(rawSubmitter),
      };
    };

    // Project to OpenRaceDTOs + teammatePicks
    const teammatePicks: Record<string, Record<string, MyPickDTO>> = {};

    const openRaces: OpenRaceDTO[] = openEntries.map(({ race, leagueId }, i) => {
      const parsed = rawPredictions[i]
        ? PredictionsReadSchema.safeParse(rawPredictions[i])
        : null;
      const preds = parsed?.success ? parsed.data : null;

      const myPick = buildPickDTO(preds, userId);

      // Extract teammate picks for this race
      if (teammateIds.length > 0) {
        const raceTeammatePicks: Record<string, MyPickDTO> = {};
        for (const tmId of teammateIds) {
          const pick = buildPickDTO(preds, tmId);
          if (pick) raceTeammatePicks[tmId] = pick;
        }
        if (Object.keys(raceTeammatePicks).length > 0) {
          teammatePicks[race.id] = raceTeammatePicks;
        }
      }

      return {
        id: race.id,
        leagueId,
        title: race.title,
        label: race.label,
        date: race.date,
        lockTime: race.lockTime,
        startingGrid: race.startingGrid,
        keyIsSet: race.keySetAt !== null,
        myPick,
      };
    });

    // Only include racers referenced by open race grids
    const usedRacerIds = new Set(openRaces.flatMap((r) => r.startingGrid));
    const racersById: Record<string, RacerDTO> = {};
    for (const r of allRacers) {
      if (usedRacerIds.has(r.id)) {
        racersById[r.id] = {
          id: r.id,
          name: r.name,
          team: r.team,
          image: r.image,
          teamColor: r.teamColor,
        };
      }
    }

    return { openRaces, racersById, teammates, teamColor, teammatePicks };
  }
}
