import { NextResponse } from "next/server";
import { Race, RaceSchema } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { racesPath } from "@/lib/paths";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get("seasonId");
  if (!seasonId) return NextResponse.json({ error: "Missing seasonId" }, { status: 400 });
  const races = await blob.read<Race[]>(racesPath(seasonId)) ?? [];
  return NextResponse.json(races);
}

export async function PUT(request: Request) {
  const parsed = RaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, seasonId } = parsed.data;
  const path = racesPath(seasonId);
  const current = await blob.read<Race[]>(path) ?? [];
  const updated = current.some(r => r.id === id)
    ? current.map(r => r.id === id ? parsed.data : r)
    : [...current, parsed.data];

  await blob.write(path, updated);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { id, seasonId } = await request.json();
  if (!id || !seasonId) {
    return NextResponse.json({ error: "Missing id or seasonId" }, { status: 400 });
  }

  const path = racesPath(seasonId);
  const current = await blob.read<Race[]>(path) ?? [];
  await blob.write(path, current.filter(r => r.id !== id));

  return NextResponse.json({ ok: true });
}
