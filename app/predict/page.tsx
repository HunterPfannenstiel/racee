"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { type Season, type Race, type Racer, type PredictionsFile } from "@/lib/schemas";
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
  seasons: Season[];
  races: Race[];
  racersById: Record<string, Racer>;
  predictions: Record<string, PredictionsFile>;
};

function autoSelectRace(seasons: Season[], races: Race[]): { seasonId: string; raceId: string | null } | null {
  if (seasons.length === 0) return null;
  const season = seasons[0];
  const today = new Date().toISOString().split("T")[0];
  const seasonRaces = races.filter((r) => r.seasonId === season.id);
  const next =
    seasonRaces.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ??
    seasonRaces.sort((a, b) => b.date.localeCompare(a.date))[0];
  return { seasonId: season.id, raceId: next?.id ?? null };
}

export default function PredictPage() {
  const { user } = useUser();
  const [data, setData] = useState<InitData | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/predict/init?userId=${user.id}`)
      .then((r) => r.json())
      .then((d: InitData) => {
        setData(d);
        const auto = autoSelectRace(d.seasons, d.races);
        if (auto) {
          setSelectedSeasonId(auto.seasonId);
          setSelectedRaceId(auto.raceId);
        }
      });
  }, [user]);

  function handleSeasonSelect(seasonId: string) {
    if (!data || seasonId === selectedSeasonId) return;
    setSelectedSeasonId(seasonId);
    const today = new Date().toISOString().split("T")[0];
    const seasonRaces = data.races.filter((r) => r.seasonId === seasonId);
    const next =
      seasonRaces.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ??
      seasonRaces.sort((a, b) => b.date.localeCompare(a.date))[0];
    setSelectedRaceId(next?.id ?? null);
  }

  function handleRaceSelect(raceId: string) {
    setSelectedRaceId(raceId);
    setDrawerOpen(false);
  }

  function handlePredictionSave(racerIds: string[]) {
    if (!user || !selectedRaceId) return;
    setData(prev => {
      if (!prev) return prev;
      const existing = prev.predictions[selectedRaceId] ?? { key: null, predictions: {} };
      return {
        ...prev,
        predictions: {
          ...prev.predictions,
          [selectedRaceId]: { ...existing, predictions: { ...existing.predictions, [user.id]: racerIds } },
        },
      };
    });
  }

  const selectedRace = data?.races.find((r) => r.id === selectedRaceId) ?? null;
  const seasonRaces = data?.races.filter((r) => r.seasonId === selectedSeasonId) ?? [];

  return (
    <PageShell title="Predict">
      <RequireUser>
        {!data ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs tracking-widest uppercase">Loading</span>
          </div>
        ) : data.seasons.length === 0 ? (
          <p className="text-xs tracking-widest uppercase text-muted-foreground">No seasons yet.</p>
        ) : (
          <div className="flex gap-10">

            {/* Desktop sidebar — hidden on mobile */}
            <aside className="hidden md:flex flex-col gap-6 w-44 shrink-0">
              <RacePicker
                seasons={data.seasons}
                races={seasonRaces}
                selectedSeasonId={selectedSeasonId}
                selectedRaceId={selectedRaceId}
                onSeasonSelect={handleSeasonSelect}
                onRaceSelect={handleRaceSelect}
              />
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Mobile controls — hidden on desktop */}
              <div className="md:hidden space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {data.seasons.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSeasonSelect(s.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                        selectedSeasonId === s.id
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
                seasons={data.seasons}
                races={seasonRaces}
                selectedSeasonId={selectedSeasonId}
                selectedRaceId={selectedRaceId}
                onSeasonSelect={handleSeasonSelect}
                onRaceSelect={handleRaceSelect}
                showSeasons={false}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </PageShell>
  );
}
