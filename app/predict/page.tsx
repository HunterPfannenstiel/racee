"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { type League, type Race, type Racer, type PredictionsFile, type PropName } from "@/lib/schemas";
import { RequireUser } from "@/components/RequireUser";
import { PredictionForm } from "./PredictionForm";
import { RacePicker } from "./RacePicker";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type InitData = {
  leagues: League[];
  races: Race[];
  racersById: Record<string, Racer>;
  predictions: Record<string, PredictionsFile>;
};

function autoSelectRace(leagues: League[], races: Race[]): { leagueId: string; raceId: string | null } | null {
  if (leagues.length === 0) return null;
  const league = leagues[0];
  const today = new Date().toISOString().split("T")[0];
  const leagueRaces = races.filter((r) => r.leagueId === league.id);
  const next =
    leagueRaces.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ??
    leagueRaces.sort((a, b) => b.date.localeCompare(a.date))[0];
  return { leagueId: league.id, raceId: next?.id ?? null };
}

export default function PredictPage() {
  const { user } = useUser();
  const [data, setData] = useState<InitData | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/predict/init?userId=${user.id}`)
      .then((r) => r.json())
      .then((d: InitData) => {
        setData(d);
        const auto = autoSelectRace(d.leagues, d.races);
        if (auto) {
          setSelectedLeagueId(auto.leagueId);
          setSelectedRaceId(auto.raceId);
        }
      });
  }, [user]);

  function handleLeagueSelect(leagueId: string) {
    if (!data || leagueId === selectedLeagueId) return;
    setSelectedLeagueId(leagueId);
    const today = new Date().toISOString().split("T")[0];
    const leagueRaces = data.races.filter((r) => r.leagueId === leagueId);
    const next =
      leagueRaces.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ??
      leagueRaces.sort((a, b) => b.date.localeCompare(a.date))[0];
    setSelectedRaceId(next?.id ?? null);
  }

  function handleRaceSelect(raceId: string) {
    setSelectedRaceId(raceId);
    setDrawerOpen(false);
  }

  function handlePredictionSave(racerIds: string[], submittedAt: string, propPicks: Partial<Record<PropName, string>>) {
    if (!user || !selectedRaceId) return;
    setData(prev => {
      if (!prev) return prev;
      const existing = prev.predictions[selectedRaceId] ?? { key: null, predictions: {}, propPicks: {} };
      return {
        ...prev,
        predictions: {
          ...prev.predictions,
          [selectedRaceId]: {
            ...existing,
            predictions: { ...existing.predictions, [user.id]: racerIds },
            submittedAt: { ...existing.submittedAt, [user.id]: submittedAt },
            propPicks: { ...(existing.propPicks ?? {}), [user.id]: propPicks },
          },
        },
      };
    });
  }

  const selectedRace = data?.races.find((r) => r.id === selectedRaceId) ?? null;
  const leagueRaces = data?.races.filter((r) => r.leagueId === selectedLeagueId) ?? [];

  return (
    <PageShell title="Predict">
      <RequireUser>
        {!data ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs tracking-widest uppercase">Loading</span>
          </div>
        ) : data.leagues.length === 0 ? (
          <p className="text-xs tracking-widest uppercase text-muted-foreground">No leagues yet.</p>
        ) : (
          <div className="flex gap-10">

            {/* Desktop sidebar — hidden on mobile */}
            <aside className="hidden md:flex flex-col gap-6 w-44 shrink-0">
              <RacePicker
                leagues={data.leagues}
                races={leagueRaces}
                selectedLeagueId={selectedLeagueId}
                selectedRaceId={selectedRaceId}
                onLeagueSelect={handleLeagueSelect}
                onRaceSelect={handleRaceSelect}
              />
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Mobile controls — hidden on desktop */}
              <div className="md:hidden space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {data.leagues.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleLeagueSelect(s.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                        selectedLeagueId === s.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  {selectedRace ? (
                    <div>
                      <p className="text-xs text-muted-foreground">{selectedRace.date}</p>
                      <p className="text-sm font-semibold">{selectedRace.title}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No race selected</p>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
                    All races
                  </Button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {selectedRace ? (
                <PredictionForm
                  key={selectedRaceId}
                  race={selectedRace}
                  racersById={data.racersById}
                  existingPrediction={data.predictions[selectedRace.id]?.predictions[user?.id ?? ""] ?? null}
                  existingSubmittedAt={data.predictions[selectedRace.id]?.submittedAt?.[user?.id ?? ""] ?? null}
                  existingPropPicks={data.predictions[selectedRace.id]?.propPicks?.[user?.id ?? ""] ?? {}}
                  keySetAt={data.predictions[selectedRace.id]?.keySetAt ?? null}
                  onPredictionSave={handlePredictionSave}
                  onError={setError}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Select a race to get started.</p>
              )}
            </div>

          </div>
        )}
      </RequireUser>

      {/* Mobile race drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select Race</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-10 overflow-y-auto">
            {data && (
              <RacePicker
                leagues={data.leagues}
                races={leagueRaces}
                selectedLeagueId={selectedLeagueId}
                selectedRaceId={selectedRaceId}
                onLeagueSelect={handleLeagueSelect}
                onRaceSelect={handleRaceSelect}
                showLeagues={false}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </PageShell>
  );
}
