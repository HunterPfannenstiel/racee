import { NextResponse } from "next/server";
import { RacerSchema } from "@/lib/schemas";
import * as racerRepository from "@/server/repositories/racer";

export async function GET() {
  return NextResponse.json(await racerRepository.getAll());
}

export async function POST(request: Request) {
  const parsed = RacerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await racerRepository.create(parsed.data);
  return NextResponse.json({ ok: true });
}
