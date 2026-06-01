import { NextResponse } from "next/server";
import { z } from "zod";
import { BlobRaceRepository } from "@/server/repositories/blob/BlobRaceRepository";
import { RaceService } from "@/server/services/RaceService";

const BodySchema = z.object({
  motorsportId: z.string().uuid(),
  startingGrid: z.array(z.string().uuid()),
});

const svc = new RaceService(new BlobRaceRepository());

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;
  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { motorsportId, startingGrid } = parsed.data;
  await svc.setStartingGrid(motorsportId, raceId, startingGrid);
  return NextResponse.json({ ok: true });
}
