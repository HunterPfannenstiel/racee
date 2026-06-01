import { NextResponse } from "next/server";
import { BlobMotorsportRepository } from "@/server/repositories/blob/BlobMotorsportRepository";

const repo = new BlobMotorsportRepository();

export async function GET() {
  const all = await repo.findAll();
  return NextResponse.json(all.map(m => ({ id: m.motorsportId, name: m.name, slug: m.slug })));
}
