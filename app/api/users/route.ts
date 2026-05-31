import { NextResponse } from "next/server";
import { getAll } from "@/server/repositories/user";

export async function GET() {
  return NextResponse.json(await getAll());
}
