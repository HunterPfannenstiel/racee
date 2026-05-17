import { NextResponse } from "next/server";
import { z } from "zod";
import { SeasonSchema, Season } from "@/lib/schemas";
import { readBlob, overwriteBlob } from "@/lib/blob";
import { SEASONS_PATH } from "@/lib/paths";

export async function GET() {
  const result = await readBlob<Season[]>(SEASONS_PATH);
  return NextResponse.json(result ?? []);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = z.array(SeasonSchema).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await overwriteBlob(SEASONS_PATH, parsed.data);

  return NextResponse.json({ ok: true });
}
