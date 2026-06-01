import { NextResponse } from "next/server";
import { RacerSchema } from "@/lib/schemas";
import { BlobRacerRepository } from "@/server/repositories/blob/BlobRacerRepository";
import { RacerService } from "@/server/services/RacerService";

const svc = new RacerService(new BlobRacerRepository());

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = RacerSchema.omit({ id: true }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  await svc.updateRacer(id, { name: d.name, constructor: d.team, image: d.image, teamColor: d.teamColor });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await svc.deleteRacer(id);
  return NextResponse.json({ ok: true });
}
