import { NextResponse } from "next/server";
import { RacerSchema } from "@/lib/schemas";
import { BlobRacerRepository } from "@/server/repositories/blob/BlobRacerRepository";
import { RacerService } from "@/server/services/RacerService";
import type { Racer } from "@/server/domain/racer";

const svc = new RacerService(new BlobRacerRepository());

function ser(r: Racer) {
  return { id: r.racerId, name: r.name, team: r.constructorName, image: r.image, teamColor: r.teamColor };
}

export async function GET() {
  return NextResponse.json((await svc.listRacers()).map(ser));
}

export async function POST(request: Request) {
  const parsed = RacerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  await svc.createRacer({ racerId: d.id, name: d.name, constructor: d.team, image: d.image, teamColor: d.teamColor });
  return NextResponse.json({ ok: true });
}
