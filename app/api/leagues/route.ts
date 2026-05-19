import { NextResponse } from "next/server";
import { z } from "zod";
import { LeagueSchema, League } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { LEAGUES_PATH } from "@/lib/paths";

export async function GET() {
  const result = await blob.read<League[]>(LEAGUES_PATH);
  return NextResponse.json(result ?? []);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = z.array(LeagueSchema).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await blob.write(LEAGUES_PATH, parsed.data);

  return NextResponse.json({ ok: true });
}
