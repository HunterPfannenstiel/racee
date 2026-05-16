import { NextResponse } from "next/server";
import { z } from "zod";
import { RacerSchema } from "@/lib/schemas";
import { overwriteBlob } from "@/lib/blob";
import { RACERS_PATH } from "@/lib/paths";

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = z.array(RacerSchema).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await overwriteBlob(RACERS_PATH, parsed.data);

  return NextResponse.json({ ok: true });
}
