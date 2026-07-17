import type { PropName } from "@/lib/schemas";

// Shared DTOs used by any query that projects a race + the requesting
// user's (and/or a teammate's) prediction for it — currently
// UserOpenRacesQuery (open races) and UserPastRacesQuery (locked/graded
// races). Kept here instead of duplicated per-query since both the shape
// and the client-facing rpc schema (server/rpc/routers/predictions.ts) are
// identical between the two.

export type RacerDTO = {
  id: string;
  name: string;
  team: string;
  image?: string;
  teamColor?: string;
};

export type MyPickDTO = {
  racerIds: string[];
  propPicks: Partial<Record<PropName, string>>;
  submittedAt: string | null;
  submittedBy: string | null;
  submittedByName: string | null;
};

export type RacePredictionDTO = {
  id: string;
  leagueId: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
  keyIsSet: boolean;
  myPick: MyPickDTO | null;
};
