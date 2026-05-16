import { NextResponse } from "next/server";
import { RaceSchema } from "@/lib/schemas";
import { overwriteBlob, deleteBlob } from "@/lib/blob";
import { racePath } from "@/lib/paths";

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = RaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, seasonId } = parsed.data;
  await overwriteBlob(racePath(seasonId, id), parsed.data);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { id, seasonId } = await request.json();
  if (!id || !seasonId) {
    return NextResponse.json({ error: "Missing id or seasonId" }, { status: 400 });
  }
  await deleteBlob(racePath(seasonId, id));
  return NextResponse.json({ ok: true });
}
