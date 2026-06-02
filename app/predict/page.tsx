"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { type Racer, type PredictionsFile, type PropName } from "@/lib/schemas";
import { RequireUser } from "@/components/RequireUser";
import { PredictionForm } from "./PredictionForm";
import { PageShell } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { FlagIcon } from "lucide-react";

type PredictRace = {
  id: string;
  leagueId: string;
  motorsportId: string;
  title: string;
  label?: string;
  date: string;
  lockTime?: string;
  startingGrid: string[];
};

type InitData = {
  racersById: Record<string, Racer>;
  races: PredictRace[];
  predictions: Record<string, PredictionsFile>;
};

function predKey(leagueId: string, raceId: string) {
  return `${leagueId}_${raceId}`;
}

function formatChipDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
    .format(new Date(year, month - 1, day));
}

function autoSelectRace(races: PredictRace[]): string | null {
  const today = new Date().toISOString().split("T")[0];
  return (
    races.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]?.id ??
    races.sort((a, b) => b.date.localeCompare(a.date))[0]?.id ??
    null
  );
}

export default function PredictPage() {
  const { user } = useUser();
  const { activeLeagueId } = useLeague();
  const [data, setData] = useState<InitData | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/predict/init?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setData({ racersById: d.racersById, races: d.races, predictions: d.predictions });
      });
  }, [user]);

  // Auto-select race when the active league changes or data loads
  useEffect(() => {
    if (!data || !activeLeagueId) return;
    const leagueRaces = data.races.filter((r) => r.leagueId === activeLeagueId);
    setSelectedRaceId(autoSelectRace(leagueRaces));
  }, [activeLeagueId, data]);

  function handlePredictionSave(racerIds: string[], submittedAt: string, propPicks: Partial<Record<PropName, string>>) {
    if (!user || !selectedRaceId || !activeLeagueId) return;
    const key = predKey(activeLeagueId, selectedRaceId);
    setData(prev => {
      if (!prev) return prev;
      const existing = prev.predictions[key] ?? { key: null, predictions: {}, propPicks: {} };
      return {
        ...prev,
        predictions: {
          ...prev.predictions,
          [key]: {
            ...existing,
            predictions: { ...existing.predictions, [user.id]: racerIds },
            submittedAt: { ...existing.submittedAt, [user.id]: submittedAt },
            propPicks: { ...(existing.propPicks ?? {}), [user.id]: propPicks },
          },
        },
      };
    });
  }

  const leagueRaces = data?.races.filter((r) => r.leagueId === activeLeagueId) ?? [];
  const sortedRaces = [...leagueRaces].sort((a, b) => a.date.localeCompare(b.date));
  const selectedRace = leagueRaces.find((r) => r.id === selectedRaceId) ?? null;
  const activePredKey = activeLeagueId && selectedRaceId ? predKey(activeLeagueId, selectedRaceId) : null;

  return (
    <PageShell title="Predict">
      <RequireUser>
        {!data ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs tracking-[0.08em] uppercase">Loading</span>
          </div>
        ) : (
          <div className="space-y-5">

            {sortedRaces.length > 1 && (
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-0.5">
                  {sortedRaces.map((race) => {
                    const active = selectedRaceId === race.id;
                    return (
                      <button
                        key={race.id}
                        onClick={() => setSelectedRaceId(race.id)}
                        className={cn(
                          "shrink-0 rounded-sm px-3 py-2 text-left transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-subtle text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <p className="text-xs font-mono font-semibold leading-snug max-w-[120px] truncate">{race.title}</p>
                        <p className={cn("text-[10px] font-mono", active ? "opacity-70" : "")}>{formatChipDate(race.date)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {selectedRace && activePredKey ? (
                <PredictionForm
                  key={activePredKey}
                  race={selectedRace}
                  leagueId={activeLeagueId!}
                  racersById={data.racersById}
                  existingPrediction={data.predictions[activePredKey]?.predictions[user?.id ?? ""] ?? null}
                  existingSubmittedAt={data.predictions[activePredKey]?.submittedAt?.[user?.id ?? ""] ?? null}
                  existingPropPicks={data.predictions[activePredKey]?.propPicks?.[user?.id ?? ""] ?? {}}
                  keySetAt={data.predictions[activePredKey]?.keySetAt ?? null}
                  onPredictionSave={handlePredictionSave}
                  onError={setError}
                />
              ) : (
                <div className="flex flex-col items-center text-center pt-12 gap-4">
                  <FlagIcon className="size-12 text-text-tertiary" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <p className="font-heading text-[1.75rem] font-bold text-foreground">No Active Race</p>
                    <p className="text-sm font-mono text-muted-foreground">No races are scheduled for this league yet.</p>
                  </div>
                </div>
              )}
          </div>
        )}
      </RequireUser>

    </PageShell>
  );
}
