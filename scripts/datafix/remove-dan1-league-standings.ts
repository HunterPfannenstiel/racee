import {
  type DatafixOpts,
  type DatafixStepResult,
  deepEqual,
  emptyStepResult,
  generateDatafixRunId,
  isMainModule,
  parseDatafixArgs,
  printDatafixBanner,
  printPlannedChange,
  printStepSummary,
  willWrite,
  writeDatafixRevertSnapshot,
} from "./shared/datafix-shared.ts";
import { LEAGUES_PATH, teamsPath, standingsPath } from "../../lib/paths.ts";

// Step 4 of removing "Dan 1" (userId fNPil60PrdkKQOjZwMmG7XoDHNOqIJXH — see the
// now-deleted remove-dan1-test-league-data.ts, commit 212fc2d, which handled
// predictions.json for this same league/user) from league 1c527405-c475-4e55-ace6-5ec7a53d1b3b
// ("TEST!! USE THIS LEAGUE"). Steps 1-3 of the 4-step removal (leagues.json
// membership, teams.json rosters, per-race scores.json entries) are reported as
// already done for this league/user — this script only handles step 4:
// leagues/{leagueId}/standings.json, the blob the UI actually reads to render
// standings, so it's the step that makes the player actually disappear.
//
// DEVIATION FROM THE DATAFIX STANDARD — flagged for reviewer attention: the
// deleted remove-dan1-test-league-data.ts explicitly scoped itself to
// predictions.json only, with this comment: "It does NOT touch scores.json or
// standings.json — those are derived/computed projections of grading business
// logic, not just data shape, and re-deriving them correctly is explicitly out
// of scope for a datafix. Any downstream recalculation those blobs need is a
// separate concern, handled by a separate mechanism." This script directly
// edits standings.json anyway, per explicit instruction for this run. It does
// NOT attempt to re-derive anything (no re-grading, no re-running
// incorporateRaceResult) — it only surgically removes the target user's own
// entries using value-matching against the user's own individual entry (see
// removeUserFromStandings below), which is a much narrower operation than a
// full recompute. Still, this is a precedent worth a human eye: future
// player-removal datafixes should decide whether standings.json edits belong
// in the standard or should stay one-off exceptions like this one.
//
// SCHEMA NOTE on team-scores handling (server/domain/league-standings.ts,
// server/repositories/blob/BlobLeagueStandingsRepository.ts): a team's
// raceScores array is NOT a single aggregate-per-race row. incorporateRaceResult
// pushes the *same* {raceId, gridPoints, propPoints, weeklyTeamPoints} object
// onto both the scoring user's individual.raceScores AND (if that user was on
// an active team at grading time) that team's raceScores array. So a team's
// raceScores can contain multiple rows sharing a raceId (one per member who
// raced), and team rows carry no userId — there is no direct "this row belongs
// to this user" field anywhere in standings.json. This script identifies which
// team rows belong to the target user by exact value-match against that user's
// own individual.raceScores entries (multiset diff, so duplicate-valued rows
// from teammates aren't over-removed). If a given entry value-matches rows in
// more than one team (would require two different teams to have posted the
// exact same raceId/gridPoints/propPoints/weeklyTeamPoints tuple in the same
// run — extremely unlikely but not provably impossible), it is left alone and
// reported as ambiguous rather than guessed at.
//
// There is also no persisted "team total" field to separately adjust — team
// totals (rankTeams() in league-standings.ts) are computed on the fly by
// summing weeklyTeamPoints across a team's raceScores array, so removing the
// target user's rows from that array *is* the full adjustment; nothing else
// needs recomputing.
//
// Player-name resolution: display names are NOT stored in any blob (leagues.json,
// teams.json, and standings.json are all id-only) — they live in the Prisma
// `User` table (prisma/schema.prisma), the same "auth tables" the deleted
// predictions.json datafix explicitly called out as out of scope. The
// production data-fix-runner workflow (.github/workflows/data-fix-runner.yml)
// does not inject DATABASE_URL, only the blob-store secrets — so Prisma access
// is not guaranteed to work wherever this script runs. Name resolution below is
// therefore best-effort: dynamically imported and wrapped so a missing/broken
// DB connection degrades to printing the bare userId instead of crashing the
// whole script (the actual standings.json fix doesn't need the DB at all).
const DATAFIX_ID = "remove-dan1-league-standings";
const TARGET_LEAGUE_ID = "1c527405-c475-4e55-ace6-5ec7a53d1b3b";
const TARGET_USER_ID = "fNPil60PrdkKQOjZwMmG7XoDHNOqIJXH";

interface RaceScore {
  raceId: string;
  gridPoints: number;
  propPoints: number;
  weeklyTeamPoints: number;
}

interface IndividualEntry {
  userId: string;
  raceScores: RaceScore[];
}

interface TeamEntry {
  teamId: string;
  raceScores: RaceScore[];
}

interface Standings {
  leagueId: string;
  gradedRaceIds: string[];
  individual: IndividualEntry[];
  teams: TeamEntry[];
}

interface LeagueRecord {
  id: string;
  name: string;
}

interface TeamRecord {
  id: string;
  name: string;
  memberIds: string[];
}

function raceScoreEquals(a: RaceScore, b: RaceScore): boolean {
  return (
    a.raceId === b.raceId &&
    a.gridPoints === b.gridPoints &&
    a.propPoints === b.propPoints &&
    a.weeklyTeamPoints === b.weeklyTeamPoints
  );
}

interface RemovalResult {
  target: Standings;
  removedFromTeams: Array<{ teamId: string; count: number }>;
  ambiguous: RaceScore[];
}

// Pure function over the standings.json shape — see the SCHEMA NOTE above for
// why team-row attribution has to be done by value-matching against the
// player's own individual raceScores rather than a direct userId field.
function removeUserFromStandings(current: Standings, userId: string): RemovalResult {
  const playerEntry = current.individual.find((e) => e.userId === userId);
  const individual = current.individual.filter((e) => e.userId !== userId);

  if (!playerEntry || playerEntry.raceScores.length === 0) {
    return { target: { ...current, individual }, removedFromTeams: [], ambiguous: [] };
  }

  const ambiguous: RaceScore[] = [];
  const teamRemovals = new Map<string, RaceScore[]>();

  for (const rs of playerEntry.raceScores) {
    const matchingTeamIds = current.teams
      .filter((t) => t.raceScores.some((e) => raceScoreEquals(e, rs)))
      .map((t) => t.teamId);

    if (matchingTeamIds.length === 0) continue; // player wasn't on an active team for this race
    if (matchingTeamIds.length > 1) {
      ambiguous.push(rs);
      continue; // can't tell which team owns this row from standings.json alone — leave it, flag it
    }
    const [teamId] = matchingTeamIds;
    if (!teamRemovals.has(teamId)) teamRemovals.set(teamId, []);
    teamRemovals.get(teamId)!.push(rs);
  }

  const removedFromTeams: Array<{ teamId: string; count: number }> = [];
  const teams = current.teams.map((team) => {
    const toRemove = teamRemovals.get(team.teamId);
    if (!toRemove || toRemove.length === 0) return team;

    const remaining = [...toRemove];
    const kept: RaceScore[] = [];
    let removedCount = 0;
    for (const rs of team.raceScores) {
      const idx = remaining.findIndex((r) => raceScoreEquals(r, rs));
      if (idx >= 0) {
        remaining.splice(idx, 1);
        removedCount++;
      } else {
        kept.push(rs);
      }
    }
    removedFromTeams.push({ teamId: team.teamId, count: removedCount });
    return { ...team, raceScores: kept };
  });

  return { target: { ...current, individual, teams }, removedFromTeams, ambiguous };
}

// Best-effort only — see the "Player-name resolution" comment above. Never
// throws; a failure here must not block the standings.json fix.
async function resolvePlayerName(userId: string): Promise<string> {
  try {
    const { prisma } = await import("../../server/db.ts");
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!user) return `(no Prisma User record for ${userId})`;
    return user.email ? `${user.name} <${user.email}>` : user.name;
  } catch (e) {
    return `(name unresolved — Prisma unavailable in this environment: ${(e as Error).message})`;
  }
}

// Plain inline reporting — deliberately not routed through a shared
// summary/verbose abstraction, just direct console output for this one
// script's outcomes (noop / would-apply / applied / failed).
async function run(opts: DatafixOpts): Promise<DatafixStepResult> {
  const shouldWrite = willWrite(opts);
  const runId = generateDatafixRunId(DATAFIX_ID);
  const result = emptyStepResult();

  // Imported dynamically so lib/blob/index.ts's Supabase client construction
  // (which happens at import time) picks up the CI-injected env vars.
  const { blob } = await import("../../lib/blob/index.ts");

  const leaguesRaw = await blob.read<LeagueRecord[]>(LEAGUES_PATH);
  const league = (leaguesRaw ?? []).find((l) => l.id === TARGET_LEAGUE_ID);
  console.log(`league:  ${TARGET_LEAGUE_ID} — ${league ? `"${league.name}"` : "NOT FOUND in leagues.json"}`);

  const playerName = await resolvePlayerName(TARGET_USER_ID);
  console.log(`player:  ${TARGET_USER_ID} — ${playerName}`);
  console.log("");

  // Read-only double-check of step 2 (teams.json). Per instructions this is
  // report-only — do NOT patch it here even if something looks stale.
  const teamsRaw = await blob.read<TeamRecord[]>(teamsPath(TARGET_LEAGUE_ID));
  const staleTeam = (teamsRaw ?? []).find((t) => t.memberIds.includes(TARGET_USER_ID));
  if (staleTeam) {
    console.warn(
      `STALE REFERENCE (read-only check, NOT modified by this script): team "${staleTeam.name}" ` +
        `(${staleTeam.id}) in teams.json still lists ${TARGET_USER_ID} in memberIds. Step 2 was ` +
        `reported as already done — this is outside this script's scope and needs separate follow-up.`,
    );
  } else {
    console.log(`teams.json check: no stale memberIds reference to ${TARGET_USER_ID} found — step 2 looks clean.`);
  }
  console.log("");

  const path = standingsPath(TARGET_LEAGUE_ID);
  try {
    const current = await blob.read<Standings>(path);
    if (current === null) {
      result.skipped++;
      console.log(`ok (no-op): ${TARGET_LEAGUE_ID} — no standings.json for this league`);
      return result;
    }

    const { target, removedFromTeams, ambiguous } = removeUserFromStandings(current, TARGET_USER_ID);

    if (ambiguous.length > 0) {
      console.warn(
        `AMBIGUOUS: ${ambiguous.length} of the player's raceScores entries value-matched rows in more ` +
          `than one team and were left untouched: ${JSON.stringify(ambiguous)}. Needs manual review.`,
      );
    }

    if (deepEqual(current, target)) {
      result.skipped++;
      console.log(
        `ok (no-op): ${TARGET_LEAGUE_ID} — player has no individual standings entry and no matching ` +
          `team raceScores rows — nothing to remove`,
      );
      return result;
    }

    for (const r of removedFromTeams) {
      if (r.count > 0) {
        console.log(`  -> would remove ${r.count} raceScores row(s) from team ${r.teamId}'s team-scores map`);
      }
    }

    const teamNote = removedFromTeams.some((r) => r.count > 0) ? " and team-scores map" : "";
    if (!shouldWrite) {
      result.pending++;
      console.log(`would apply: ${TARGET_LEAGUE_ID} — remove player from individual standings${teamNote}`);
      printPlannedChange(current, target);
      return result;
    }

    await writeDatafixRevertSnapshot(blob, runId, path, current);
    await blob.write(path, target);
    result.applied++;
    console.log(`applied: ${TARGET_LEAGUE_ID} — removed player from standings.json${teamNote}`);
  } catch (e) {
    result.failed++;
    console.error(`FAIL: ${TARGET_LEAGUE_ID} —`, e);
  }

  return result;
}

if (isMainModule(import.meta.url)) {
  const opts: DatafixOpts = parseDatafixArgs(process.argv.slice(2));
  printDatafixBanner(opts, [
    `target league:    ${TARGET_LEAGUE_ID} (TEST!! USE THIS LEAGUE)`,
    `target user:      ${TARGET_USER_ID} ("Dan 1")`,
    `step:             4/4 — leagues/{leagueId}/standings.json (individual + team-scores)`,
  ]);

  run(opts).then((result) => {
    printStepSummary(DATAFIX_ID, result, opts);
    if (result.failed > 0) process.exitCode = 1;
  });
}
