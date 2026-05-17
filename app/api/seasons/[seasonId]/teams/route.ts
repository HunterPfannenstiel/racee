import { NextResponse } from "next/server";
import { Team } from "@/lib/schemas";
import { blob } from "@/lib/blob";
import { teamsPath } from "@/lib/paths";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params;
  const teams = await blob.read<Team[]>(teamsPath(seasonId));
  return NextResponse.json(teams ?? []);
}
