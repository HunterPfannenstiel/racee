import type { PropPointValues } from "@/server/domain/league";

export type MeLeagueDTO = {
  id: string;
  commissionerId: string;
  name: string;
  placementPoints: number[];
  mulliganCount: number;
  scoringDepth?: number;
  stageCount?: number;
  propPointValues: PropPointValues;
  motorsportId: string;
};

export type MeResult = {
  id: string;
  name: string;
  isAdmin: boolean;
  /** Avatar value — see lib/avatar.ts. */
  image: string | null;
  /** True when an admin has turned off photo uploads for this account. */
  photoUploadsBlocked: boolean;
  leagues: MeLeagueDTO[];
};

export interface IMeQuery {
  execute(userId: string): Promise<MeResult>;
}
