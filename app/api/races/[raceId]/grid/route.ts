import { NextResponse } from "next/server";
import { z } from "zod";
import * as raceRepository from "@/server/repositories/race";

const BodySchema = z.object({
  leagueId: z.string().uuid(),
  startingGrid: z.array(z.string().uuid()),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { leagueId, startingGrid } = parsed.data;
  const races = await raceRepository.getForLeague(leagueId);
  const race = races.find((r) => r.id === raceId);
  if (!race) return NextResponse.json({ error: "Race not found" }, { status: 404 });
  await raceRepository.update(leagueId, raceId, { ...race, startingGrid });
  return NextResponse.json({ ok: true });
}
