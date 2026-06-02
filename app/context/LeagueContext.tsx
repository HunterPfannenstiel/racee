"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type League } from "@/lib/schemas";
import { useUser } from "@/app/context/UserContext";

const storageKey = (userId: string) => `racee_active_league:${userId}`;

type LeagueContextValue = {
  leagues: League[];
  activeLeagueId: string | null;
  setActiveLeagueId: (id: string) => void;
  isLoading: boolean;
};

const LeagueContext = createContext<LeagueContextValue>({
  leagues: [],
  activeLeagueId: null,
  setActiveLeagueId: () => {},
  isLoading: true,
});

export function LeagueContextProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLeagues([]);
      setActiveLeagueIdState(null);
      setIsLoading(false);
      return;
    }
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((data: League[]) => {
        setLeagues(data);
        const stored = localStorage.getItem(storageKey(user.id));
        const valid = data.find((l) => l.id === stored);
        const selected = valid ?? data[0] ?? null;
        setActiveLeagueIdState(selected?.id ?? null);
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  function setActiveLeagueId(id: string) {
    setActiveLeagueIdState(id);
    if (user) localStorage.setItem(storageKey(user.id), id);
  }

  return (
    <LeagueContext.Provider value={{ leagues, activeLeagueId, setActiveLeagueId, isLoading }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  return useContext(LeagueContext);
}
