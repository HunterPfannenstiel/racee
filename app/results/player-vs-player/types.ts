import type { PropName } from "@/lib/schemas";

export type PvpPlayer = {
  userId: string;
  name: string;
  color: string;
  isCurrentUser: boolean;
  rank: number;
  points: number;
  pointsBack: number;
  propsPoints: number;
  gridPoints: number;
};

export type PvpComparison = {
  raceTitle: string;
  left: PvpPlayer;
  right: PvpPlayer;
  rollupText: string;
  // League's scoring depth (Grid Prediction rows past this position never
  // score) -- undefined means the league scores the full grid.
  scoringDepth?: number;
};

export type PropPickRow = {
  prop: PropName;
  label: string;
  actual: string;
  leftPick: string;
  leftPickColor?: string;
  leftPoints: number;
  rightPick: string;
  rightPickColor?: string;
  rightPoints: number;
};

export type GridPredictionRow = {
  position: number;
  actualRacerName: string;
  leftRacerName: string;
  leftRacerColor?: string;
  leftPoints: number;
  rightRacerName: string;
  rightRacerColor?: string;
  rightPoints: number;
};

export type JumpablePlayer = {
  userId: string;
  name: string;
  color: string;
  rank: number | null;
  hasSubmitted: boolean;
};

export type JumpDrawerSide = "left" | "right";

// Shared shape both useMockPlayerVsPlayer (prototype) and usePlayerVsPlayer
// (real, query-param-backed) produce -- lets PlayerVsPlayerView stay agnostic
// to which data source is behind it.
export type PlayerVsPlayerViewModel = {
  comparison: PvpComparison;
  propPickRows: PropPickRow[];
  gridPredictionRows: GridPredictionRow[];
  jumpablePlayers: JumpablePlayer[];
  pickDrawerOpen: boolean;
  onOpenPickDrawer: () => void;
  onClosePickDrawer: () => void;
  jumpDrawerSide: JumpDrawerSide | null;
  onOpenJumpDrawer: (side: JumpDrawerSide) => void;
  onCloseJumpDrawer: () => void;
  onSelectPlayer: (side: JumpDrawerSide, userId: string) => void;
  onStepPlayer: (side: JumpDrawerSide, direction: "prev" | "next") => void;
  canStepPlayer: (side: JumpDrawerSide, direction: "prev" | "next") => boolean;
  onBackToYou: () => void;
  onSwapSides: () => void;
};
