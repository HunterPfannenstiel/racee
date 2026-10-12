"use client";

import { createContext, useContext } from "react";

const AvatarLeagueContext = createContext<string | null>(null);

/**
 * Pages about one specific league (e.g. the commissioner's league pages) wrap
 * themselves in this so every avatar inside uses that league's colors, even
 * if it's not the user's active league.
 */
export function AvatarLeagueScope({ leagueId, children }: { leagueId: string | null; children: React.ReactNode }) {
  return <AvatarLeagueContext.Provider value={leagueId}>{children}</AvatarLeagueContext.Provider>;
}

export function useAvatarLeagueScope() {
  return useContext(AvatarLeagueContext);
}
