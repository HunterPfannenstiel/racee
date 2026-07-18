"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";

const storageKey = (userId: string) => `racee_active_league:${userId}`;

/**
 * Thin, selection-only context: which league is "active" in the UI, persisted
 * to localStorage per-user. This does NOT fetch or hold the league list
 * itself — components that need the list of leagues call
 * `useQuery(orpc.leagues.list.queryOptions())` directly.
 */
type LeagueContextValue = {
  activeLeagueId: string | null;
  setActiveLeagueId: (id: string) => void;
};

const LeagueContext = createContext<LeagueContextValue>({
  activeLeagueId: null,
  setActiveLeagueId: () => {},
});

export function LeagueContextProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [activeLeagueId, setActiveLeagueIdState] = useState<string | null>(null);

  // Re-sync from localStorage whenever the signed-in user changes (including
  // signing out, which clears selection). Keyed on user.id rather than the
  // `user` object itself, since useUser() returns a fresh object every render.
  useEffect(() => {
    if (!user) {
      setActiveLeagueIdState(null);
      return;
    }
    setActiveLeagueIdState(localStorage.getItem(storageKey(user.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function setActiveLeagueId(id: string) {
    setActiveLeagueIdState(id);
    if (user) localStorage.setItem(storageKey(user.id), id);
  }

  return (
    <LeagueContext.Provider value={{ activeLeagueId, setActiveLeagueId }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  return useContext(LeagueContext);
}
