import { NextResponse } from "next/server";
import { BlobRaceRepository } from "@/server/repositories/race/BlobRaceRepository";
import { BlobLeagueRepository } from "@/server/repositories/league/BlobLeagueRepository";
import type { Race } from "@/server/domain/race";

// Legacy route handler — allowed to touch repositories directly (not an oRPC
// procedure). Still consumed by app/commissioner/leagues/[leagueId]/player-status/hooks/usePlayerStatus.ts
// and app/admin/results/{page.tsx,[raceId]/page.tsx} until later migration phases port
// them onto orpc.races.list. The POST handler that used to live here (race creation)
// has moved to orpc.races.create — see server/rpc/routers/races.ts.
const raceRepo = new BlobRaceRepository();
const leagueRepo = new BlobLeagueRepository();

function ser(r: Race) {
  return { id: r.raceId, motorsportId: r.motorsportId, title: r.title, label: r.label, date: r.date, lockTime: r.lockTime, startingGrid: [...r.startingGrid], keyOrder: r.keyOrder ? [...r.keyOrder] : null, propKey: r.propKey, keySetAt: r.keySetAt };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const motorsportId = searchParams.get("motorsportId");
  const leagueId = searchParams.get("leagueId");

  if (motorsportId) {
    return NextResponse.json((await raceRepo.findAllForMotorsport(motorsportId)).map(ser));
  }

  if (leagueId) {
    const league = await leagueRepo.findById(leagueId);
    if (!league) return NextResponse.json({ error: `League not found: ${leagueId}` }, { status: 404 });
    return NextResponse.json((await raceRepo.findAllForMotorsport(league.motorsportId)).map(ser));
  }

  return NextResponse.json({ error: "Missing motorsportId or leagueId" }, { status: 400 });
}
