import { NextResponse } from "next/server";
import { ParticipantsSchema } from "@/lib/schemas";
import { readBlob, overwriteBlob } from "@/lib/blob";

const BLOB_PATHNAME = "participants.json";

export async function GET() {
  const result = await readBlob(BLOB_PATHNAME);
  if (!result) return NextResponse.json({ users: [], teams: [] });
  const data = await new Response(result.stream).json();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = ParticipantsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await overwriteBlob(BLOB_PATHNAME, parsed.data);

  return NextResponse.json({ ok: true });
}
