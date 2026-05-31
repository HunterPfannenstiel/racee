import { NextResponse } from "next/server";
import * as leagueRepository from "@/server/repositories/league";
import { getAll as getAllUsers } from "@/server/repositories/user";

export async function GET() {
  const [users, leagues] = await Promise.all([getAllUsers(), leagueRepository.getAll()]);
  return NextResponse.json({ users, leagues });
}
