"use client";

import { createContext, useContext } from "react";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";
import { TeamLogo } from "@/components/avatar/TeamLogo";
import type { AvatarSize } from "@/components/avatar/PlayerAvatar";
import type { CutsceneData } from "./beats/types";

type IdentityContextValue = Pick<CutsceneData, "mode" | "leagueId" | "teams">;

const CutsceneIdentityContext = createContext<IdentityContextValue>({ mode: "drivers" });

export function CutsceneIdentityProvider({ data, children }: { data: CutsceneData; children: React.ReactNode }) {
  return (
    <CutsceneIdentityContext.Provider value={{ mode: data.mode, leagueId: data.leagueId, teams: data.teams }}>
      {children}
    </CutsceneIdentityContext.Provider>
  );
}

/** True when the cutscene is revealing team (constructor) scores. */
export function useIsConstructorsCutscene() {
  return useContext(CutsceneIdentityContext).mode === "constructors";
}

/**
 * The picture for one cutscene entry: the player's avatar in the drivers
 * reveal, or the team's logo in the constructors reveal.
 */
export function CutsceneIdentity({ id, name, size, className }: { id: string; name: string; size: AvatarSize; className?: string }) {
  const { mode, leagueId, teams } = useContext(CutsceneIdentityContext);
  if (mode === "constructors") {
    const team = teams?.find((t) => t.id === id);
    if (!team) return null;
    return <TeamLogo leagueId={leagueId ?? ""} teamId={team.id} name={team.name} color={team.color} logo={team.logo} size={size} className={className} />;
  }
  return <LeaguePlayerAvatar userId={id} name={name} size={size} className={className} />;
}
