"use client";

import { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { toPvpPlayer, buildPropPickRows, buildGridPredictionRows } from "../adapters";
import type { JumpDrawerSide, PropPickRow, GridPredictionRow, PvpComparison, PlayerVsPlayerViewModel } from "../types";
import { usePvpSearchParams } from "./usePvpSearchParams";
import { usePlayerVsPlayerRaceData, type PvpEntry, type PvpRacer } from "./usePlayerVsPlayerRaceData";

export type PlayerVsPlayerStatus = "loading" | "error" | "not-found" | "not-submitted" | "ready";

type ComparisonBundle = {
  comparison: PvpComparison;
  propPickRows: PropPickRow[];
  gridPredictionRows: GridPredictionRow[];
};

// Each status carries exactly what its page branch actually uses -- only
// "ready" satisfies PlayerVsPlayerViewModel, so PlayerVsPlayerView can never
// be called without a comparison; the type system enforces the narrowing
// page.tsx already does at runtime, instead of a defensive re-check inside
// the view.
export type UsePlayerVsPlayerResult =
  | { status: "loading" }
  | { status: "error"; error: unknown; onRetry: () => void }
  | { status: "not-found" }
  | { status: "not-submitted" }
  | ({ status: "ready" } & PlayerVsPlayerViewModel);

function buildComparisonBundle(
  left: PvpEntry,
  right: PvpEntry,
  raceTitle: string,
  raceKeyOrder: string[],
  racersById: Record<string, PvpRacer>,
  scoringDepth: number | undefined,
  currentUserId: string | undefined,
): ComparisonBundle {
  const leftPlayer = toPvpPlayer(left, left.userId === currentUserId);
  const rightPlayer = toPvpPlayer(right, right.userId === currentUserId);
  const propPickRows = buildPropPickRows(left, right, racersById);
  const gridPredictionRows = buildGridPredictionRows(left, right, raceKeyOrder, racersById);

  return {
    comparison: {
      raceTitle,
      left: leftPlayer,
      right: rightPlayer,
      scoringDepth,
    },
    propPickRows,
    gridPredictionRows,
  };
}

/**
 * Real, query-param-backed replacement for useMockPlayerVsPlayer. Fetches
 * the whole race's data once (see usePlayerVsPlayerRaceData) and resolves
 * the current left/right pair purely client-side -- stepping and jumping
 * never trigger a new request.
 */
export function usePlayerVsPlayer(): UsePlayerVsPlayerResult {
  const { leagueId, raceId, leftUserId, rightUserId, setLeftUserId, setRightUserId, setUserIds } = usePvpSearchParams();
  const { user } = useUser();
  const raceDataQuery = usePlayerVsPlayerRaceData(leagueId, raceId);

  const [pickDrawerOpen, setPickDrawerOpen] = useState(false);
  const [jumpDrawerSide, setJumpDrawerSide] = useState<JumpDrawerSide | null>(null);

  function backToYou() {
    // Publicly viewable while logged out (see server/rpc/procedures.ts's
    // publicProcedure) -- with no signed-in user there's no "you" to reset to.
    if (user) setLeftUserId(user.id);
  }

  if (raceDataQuery.isError) {
    return { status: "error", error: raceDataQuery.error, onRetry: () => raceDataQuery.refetch() };
  }

  const data = raceDataQuery.data;
  if (!data) {
    return { status: "loading" };
  }

  const entries = data.entries;
  const leftEntry = entries.find((e) => e.userId === leftUserId);
  const rightEntry = entries.find((e) => e.userId === rightUserId);

  if (!leftEntry || !rightEntry) {
    return { status: "not-found" };
  }

  const submittedSortedByRank = entries
    .filter((e): e is PvpEntry & { rank: number } => e.hasSubmitted && e.rank != null)
    .sort((a, b) => a.rank - b.rank);

  // Neither slot is guaranteed a submission (e.g. a direct URL, or the
  // viewer per buildPvpHref). A non-submitting side falls back to 1st place.
  const firstPlaceEntry = submittedSortedByRank[0];

  const resolvedLeftEntry = leftEntry.hasSubmitted ? leftEntry : (firstPlaceEntry ?? leftEntry);
  const resolvedRightEntry = rightEntry.hasSubmitted ? rightEntry : (firstPlaceEntry ?? rightEntry);

  if (!resolvedLeftEntry.hasSubmitted || !resolvedRightEntry.hasSubmitted) {
    return { status: "not-submitted" };
  }

  function setSide(side: JumpDrawerSide, userId: string) {
    if (side === "left") setLeftUserId(userId);
    else setRightUserId(userId);
  }

  function stepIndex(side: JumpDrawerSide): number {
    const currentId = side === "left" ? resolvedLeftEntry.userId : resolvedRightEntry.userId;
    return submittedSortedByRank.findIndex((e) => e.userId === currentId);
  }

  function stepPlayer(side: JumpDrawerSide, direction: "prev" | "next") {
    const currentIndex = stepIndex(side);
    if (currentIndex === -1) return;
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= submittedSortedByRank.length) return;
    setSide(side, submittedSortedByRank[nextIndex].userId);
  }

  function canStepPlayer(side: JumpDrawerSide, direction: "prev" | "next"): boolean {
    const currentIndex = stepIndex(side);
    if (currentIndex === -1) return false;
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    return nextIndex >= 0 && nextIndex < submittedSortedByRank.length;
  }

  function selectPlayer(side: JumpDrawerSide, userId: string) {
    setSide(side, userId);
    setJumpDrawerSide(null);
  }

  function swapSides() {
    setUserIds(resolvedRightEntry.userId, resolvedLeftEntry.userId);
  }

  const bundle: ComparisonBundle = buildComparisonBundle(
    resolvedLeftEntry,
    resolvedRightEntry,
    data.race.title,
    data.race.keyOrder ?? [],
    data.racersById,
    data.league.scoringDepth,
    user?.id,
  );

  return {
    status: "ready",
    comparison: bundle.comparison,
    propPickRows: bundle.propPickRows,
    gridPredictionRows: bundle.gridPredictionRows,
    jumpablePlayers: entries.map((e) => ({
      userId: e.userId,
      name: e.name,
      color: e.color,
      rank: e.rank,
      hasSubmitted: e.hasSubmitted,
    })),
    pickDrawerOpen,
    onOpenPickDrawer: () => setPickDrawerOpen(true),
    onClosePickDrawer: () => setPickDrawerOpen(false),
    jumpDrawerSide,
    onOpenJumpDrawer: (side: JumpDrawerSide) => setJumpDrawerSide(side),
    onCloseJumpDrawer: () => setJumpDrawerSide(null),
    onSelectPlayer: selectPlayer,
    onStepPlayer: stepPlayer,
    canStepPlayer,
    onBackToYou: backToYou,
    onSwapSides: swapSides,
  };
}
