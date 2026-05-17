import { NextResponse } from "next/server";
import { z } from "zod";
import { RacerSchema, Racer } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { RACERS_PATH } from "@/lib/paths";

export async function GET() {
  const result = await blob.read<Racer[]>(RACERS_PATH);
  return NextResponse.json(result ?? []);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = z.array(RacerSchema).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await blob.write(RACERS_PATH, parsed.data);

  return NextResponse.json({ ok: true });
}
