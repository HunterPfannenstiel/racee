"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";

/**
 * Query key is [leagueId, raceId] only -- deliberately excludes leftUserId/
 * rightUserId. Every league member's data for this race is fetched once;
 * switching which two are being compared is a client-side selection over
 * this same cached payload, never a new request.
 */
export function usePlayerVsPlayerRaceData(leagueId: string | null, raceId: string | null) {
  return useQuery(
    orpc.playerVsPlayer.get.queryOptions({
      input: { leagueId: leagueId ?? "", raceId: raceId ?? "" },
      enabled: !!leagueId && !!raceId,
    }),
  );
}

// Derived from the query's own inferred output (the oRPC/zod contract) rather
// than importing the server's internal query-interface types directly --
// those use stricter "required key, possibly undefined" fields than what
// actually crosses the wire (zod's .optional() is an omittable key).
export type PvpRaceData = NonNullable<ReturnType<typeof usePlayerVsPlayerRaceData>["data"]>;
export type PvpEntry = PvpRaceData["entries"][number];
export type PvpRacer = PvpRaceData["racersById"][string];
