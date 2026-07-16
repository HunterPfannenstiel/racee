"use client";

import { useState } from "react";
import {
  MOCK_CURRENT_USER_ID,
  MOCK_ROSTER,
  MOCK_JUMPABLE_PLAYERS,
  buildComparison,
  getPropPickRows,
  getGridPredictionRows,
} from "../mock-data";
import type { JumpDrawerSide, PlayerVsPlayerViewModel } from "../types";

export type { JumpDrawerSide } from "../types";

// Defaults to comparing the current user against another submitted player.
const DEFAULT_LEFT_USER_ID = MOCK_CURRENT_USER_ID;
const DEFAULT_RIGHT_USER_ID = "u-5";

export function useMockPlayerVsPlayer(): PlayerVsPlayerViewModel {
  const [leftUserId, setLeftUserId] = useState(DEFAULT_LEFT_USER_ID);
  const [rightUserId, setRightUserId] = useState(DEFAULT_RIGHT_USER_ID);
  const [pickDrawerOpen, setPickDrawerOpen] = useState(false);
  const [jumpDrawerSide, setJumpDrawerSide] = useState<JumpDrawerSide | null>(null);

  function stepIndex(side: JumpDrawerSide): number {
    const currentId = side === "left" ? leftUserId : rightUserId;
    return MOCK_ROSTER.findIndex((p) => p.userId === currentId);
  }

  function stepPlayer(side: JumpDrawerSide, direction: "prev" | "next") {
    const currentIndex = stepIndex(side);
    if (currentIndex === -1) return;
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= MOCK_ROSTER.length) return;
    const nextId = MOCK_ROSTER[nextIndex].userId;
    if (side === "left") setLeftUserId(nextId);
    else setRightUserId(nextId);
  }

  function canStepPlayer(side: JumpDrawerSide, direction: "prev" | "next"): boolean {
    const currentIndex = stepIndex(side);
    if (currentIndex === -1) return false;
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    return nextIndex >= 0 && nextIndex < MOCK_ROSTER.length;
  }

  function selectPlayer(side: JumpDrawerSide, userId: string) {
    if (side === "left") setLeftUserId(userId);
    else setRightUserId(userId);
    setJumpDrawerSide(null);
  }

  function backToYou() {
    setLeftUserId(MOCK_CURRENT_USER_ID);
  }

  function swapSides() {
    setLeftUserId(rightUserId);
    setRightUserId(leftUserId);
  }

  // stepPlayer/selectPlayer only ever set ids drawn from MOCK_ROSTER (the
  // jump drawer disables non-submitted rows), so buildComparison always
  // resolves both sides -- this hook has no "not ready" state to represent.
  const comparison = buildComparison(leftUserId, rightUserId)!;

  return {
    comparison,
    propPickRows: getPropPickRows(leftUserId, rightUserId),
    gridPredictionRows: getGridPredictionRows(leftUserId, rightUserId),
    jumpablePlayers: MOCK_JUMPABLE_PLAYERS,
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
