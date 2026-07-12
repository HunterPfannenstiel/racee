import { z } from "zod";
import { blob } from "@/lib/blob";
import { teamsPath } from "@/lib/paths";
import { Team } from "@/server/domain/team";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import type { ITeamRepository } from "./ITeamRepository";

const TeamPersistenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
  color: z.string().optional(),
});
type TeamPersistence = z.infer<typeof TeamPersistenceSchema>;

function toDomain(leagueId: string, raw: TeamPersistence): Team {
  return new Team({ teamId: raw.id, leagueId, name: raw.name, memberIds: raw.memberIds, color: raw.color });
}

function toPersistence(team: Team): TeamPersistence {
  return { id: team.teamId, name: team.name, memberIds: [...team.memberIds], color: team.color };
}

async function readAll(leagueId: string): Promise<TeamPersistence[]> {
  const path = teamsPath(leagueId);
  let raw: unknown;
  try {
    raw = await blob.read<unknown>(path);
  } catch (e) {
    throw new PersistenceError("read", path, e);
  }
  if (raw === null) return [];
  try {
    return z.array(TeamPersistenceSchema).parse(raw);
  } catch (e) {
    throw new ParseError(path, e);
  }
}

export class BlobTeamRepository implements ITeamRepository {
  async findAllForLeague(leagueId: string): Promise<Team[]> {
    return (await readAll(leagueId)).map(r => toDomain(leagueId, r));
  }

  async findById(leagueId: string, teamId: string): Promise<Team | null> {
    const all = await readAll(leagueId);
    const found = all.find(t => t.id === teamId);
    return found ? toDomain(leagueId, found) : null;
  }

  async saveAll(teams: Team[]): Promise<void> {
    if (teams.length === 0) return;
    const leagueId = teams[0].leagueId;
    const path = teamsPath(leagueId);
    const existing = await readAll(leagueId);
    const upserted = [...existing];
    for (const team of teams) {
      const p = toPersistence(team);
      const idx = upserted.findIndex(t => t.id === p.id);
      if (idx >= 0) upserted[idx] = p;
      else upserted.push(p);
    }
    try {
      await blob.write(path, upserted);
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }

  async save(team: Team): Promise<void> {
    return this.saveAll([team]);
  }

  async remove(leagueId: string, teamId: string): Promise<void> {
    const path = teamsPath(leagueId);
    const all = await readAll(leagueId);
    try {
      await blob.write(path, all.filter(t => t.id !== teamId));
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
