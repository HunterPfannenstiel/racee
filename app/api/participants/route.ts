import { NextResponse } from "next/server";
import { ParticipantsSchema } from "@/lib/schemas";
import { blob } from "@/lib/blob";

const BLOB_PATHNAME = "participants.json";

export async function GET() {
  const result = await blob.read(BLOB_PATHNAME);
  if (!result) return NextResponse.json({ users: [] });
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = ParticipantsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await blob.write(BLOB_PATHNAME, parsed.data);

  return NextResponse.json({ ok: true });
}
