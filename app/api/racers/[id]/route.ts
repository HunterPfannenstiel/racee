import { NextResponse } from "next/server";
import { RacerSchema } from "@/lib/schemas";
import * as racerRepository from "@/server/repositories/racer";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = RacerSchema.omit({ id: true }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await racerRepository.update(id, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await racerRepository.remove(id);
  return NextResponse.json({ ok: true });
}
