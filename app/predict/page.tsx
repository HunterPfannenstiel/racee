"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { useLeague } from "@/app/context/LeagueContext";
import { type Racer, type PredictionsFile, type PropName } from "@/lib/schemas";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  function handleRaceSelect(raceId: string) {
    setSelectedRaceId(raceId);
    setDrawerOpen(false);
  }

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
  const selectedRace = leagueRaces.find((r) => r.id === selectedRaceId) ?? null;
  const activePredKey = activeLeagueId && selectedRaceId ? predKey(activeLeagueId, selectedRaceId) : null;

  return (
    <PageShell title="Predict">
      <RequireUser>
        {!data ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs tracking-widest uppercase">Loading</span>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Race selector */}
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
                <p className="text-sm text-muted-foreground">Select a race to get started.</p>
              )}
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
            <RacePicker
              races={leagueRaces}
              selectedRaceId={selectedRaceId}
              onRaceSelect={handleRaceSelect}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </PageShell>
  );
}
