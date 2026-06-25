import { blob } from "../lib/blob/index.ts";

type LeagueBlob = {
  id: string;
  commissionerId: string;
  coCommissionerIds?: string[];
  memberIds?: string[];
};

type TeamBlob = {
  memberIds?: string[];
};

const leagues = await blob.read<LeagueBlob[]>("leagues.json").then(r => r ?? []);

let migrated = 0;

const updated = await Promise.all(
  leagues.map(async (league) => {
    if (league.memberIds && league.memberIds.length > 0) return league;

    const teams = await blob.read<TeamBlob[]>(`leagues/${league.id}/teams.json`).then(r => r ?? []);

    const memberSet = new Set<string>();
    memberSet.add(league.commissionerId);
    for (const id of league.coCommissionerIds ?? []) memberSet.add(id);
    for (const team of teams) {
      for (const id of team.memberIds ?? []) memberSet.add(id);
    }

    migrated++;
    return { ...league, memberIds: [...memberSet] };
  }),
);

if (migrated > 0) {
  await blob.write("leagues.json", updated);
  console.log(`migrated ${migrated} league(s) — memberIds backfilled`);
} else {
  console.log("no leagues needed migration");
}
