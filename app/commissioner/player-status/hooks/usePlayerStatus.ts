"use client";

import { useEffect, useState } from "react";

export type SubmissionStatus = "submitted" | "pending" | "missed";

export type MemberSubmission = {
  id: string;
  name: string;
  status: SubmissionStatus;
  submittedAt: string | null;
};

type PlayerStatusRace = {
  id: string;
  title: string;
  date: string;
};

type PlayerStatusMember = {
  id: string;
  name: string;
  submittedAt: string | null;
};

function pickDefaultRaceId(races: PlayerStatusRace[]): string | null {
  if (races.length === 0) return null;
  const today = new Date().toISOString().split("T")[0];
  const upcoming = races.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length > 0) return upcoming[0].id;
  return [...races].sort((a, b) => b.date.localeCompare(a.date))[0].id;
}

export function usePlayerStatus(leagueId: string) {
  const [races, setRaces] = useState<PlayerStatusRace[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [lockTime, setLockTime] = useState<string | null>(null);
  const [members, setMembers] = useState<PlayerStatusMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/races?leagueId=${leagueId}`)
      .then((r) => r.json())
      .then((data: PlayerStatusRace[]) => {
        if (cancelled) return;
        setRaces(data);
        const defaultId = pickDefaultRaceId(data);
        setSelectedRaceId((current) => current ?? defaultId);
        if (!defaultId) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load races.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  useEffect(() => {
    if (!selectedRaceId) return;
    let cancelled = false;
    fetch(`/api/commissioner/leagues/${leagueId}/player-status?raceId=${selectedRaceId}`)
      .then((r) => r.json())
      .then(
        (
          data:
            | { race: { locked: boolean; lockTime: string | null }; members: PlayerStatusMember[] }
            | { error: string }
        ) => {
          if (cancelled) return;
          if ("error" in data) {
            setError(data.error);
          } else {
            setLocked(data.race.locked);
            setLockTime(data.race.lockTime);
            setMembers(data.members);
          }
          setLoading(false);
        }
      )
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load submission status.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [leagueId, selectedRaceId]);

  const withStatus: MemberSubmission[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    status: m.submittedAt ? "submitted" : locked ? "missed" : "pending",
    submittedAt: m.submittedAt,
  }));

  return {
    races,
    selectedRaceId: selectedRaceId ?? "",
    setSelectedRaceId,
    locked,
    lockTime,
    outstanding: withStatus.filter((m) => m.status !== "submitted"),
    submitted: withStatus.filter((m) => m.status === "submitted"),
    loading,
    error,
  };
}
