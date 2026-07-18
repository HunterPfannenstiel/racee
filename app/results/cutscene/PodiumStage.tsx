"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import { cn } from "@/lib/utils";
import { medalColor } from "@/lib/colors";
import { PLATFORM_ORDER } from "../Podium";
import { groupEntriesByRank } from "../rank-utils";
import { OFF_FRAME_Y } from "./LadderStage";
import { TeamColorShimmer } from "./TeamColorShimmer";
import { useCountUpValue, type CountUpPhase } from "./useCountUpValue";

// Same "no data" convention used elsewhere (Podium.tsx, formatStats.ts,
// StatStrip.tsx, RaceCell.tsx) -- reused for a rank slot nobody holds (e.g.
// a tie for 2nd means no entry has rank 3).
const NO_DATA = "—";

// Duplicated from GroupStage (not exported there) -- keeps this Stage's
// motion feel identical without pulling every Stage into a shared utils
// module for two small pure functions. Same reasoning as EstablishingCardStage.
const EASE_HARD_DECEL: [number, number, number, number] = [0.25, 1, 0.5, 1];
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}
function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export type PodiumBoxEntry = {
  userId: string;
  name: string;
  rank: 1 | 2 | 3;
  points: number;
  /** The finisher's own identity color (ResultsRowData.color) -- colors the
   *  team-name line under their name. Box background/border/glow, the
   *  points count-up, and (for the viewer only) the box's landing
   *  TeamColorShimmer all use rank-based medalColor/MEDAL_HEX instead,
   *  matching the real page's Podium.tsx. */
  color: string;
  teamName: string;
  isMe: boolean;
};

export type PodiumEvent = {
  startMs: number;
  /** Whatever rank-1/2/3 entries are actually present -- a partial field can be missing one. */
  entries: PodiumBoxEntry[];
  /** Stage rises from below-frame, canonical ms. */
  riseMs: number;
  /** Stage grows from its small entrance scale to full ceremonial scale, canonical ms. Starts once riseMs completes. */
  expandMs: number;
  thirdCountUpMs: number;
  thirdHoldMs: number;
  secondCountUpMs: number;
  secondHoldMs: number;
  firstCountUpMs: number;
  firstHoldMs: number;
  /** Brief pause between one rank's hold ending and the next rank's reveal starting. */
  gapToSecondMs: number;
  gapToFirstMs: number;
};

export type PodiumRankPhase = "pending" | "counting" | "revealed";

export type PodiumStageState = {
  event: PodiumEvent | null;
  /** "stage" = rise+expand still in progress, boxes empty. Otherwise, whichever rank is currently being announced (or "done" once 1st has fully settled). */
  phase: "stage" | "third" | "second" | "first" | "done";
  /** Elapsed canonical ms since `phase` began. */
  elapsedMs: number;
  rank3: PodiumRankPhase;
  rank2: PodiumRankPhase;
  rank1: PodiumRankPhase;
};

type PodiumStageProps = {
  state: PodiumStageState;
  playbackRate: number;
};

// Entrance scale: starts small (part of the "rises up" read), grows to 1 as
// it expands -- "full ceremonial scale" comes from the boxes' own oversized
// dimensions/typography below, not from scaling past 1 (which would blur
// text under a CSS transform in some browsers).
const STAGE_ENTER_SCALE = 0.55;
const STAGE_FULL_SCALE = 1;

// Ceremonial box heights -- deliberately NOT matching the real page's
// PLATFORM_HEIGHT (app/results/Podium.tsx); that reconciliation is out of
// scope for this beat. Only PLATFORM_ORDER (2nd-left, 1st-center, 3rd-right)
// is shared, since that's layout convention, not sizing.
const CEREMONIAL_HEIGHT: Record<1 | 2 | 3, string> = {
  1: "h-64 sm:h-80",
  2: "h-48 sm:h-60",
  3: "h-40 sm:h-52",
};

// Raw hex twins of lib/colors.ts's medalColor/medalBorderColor (Tailwind's
// amber-400 / slate-400 / amber-700) -- the box background/border/glow below
// are inline motion styles built via hex+alpha string concatenation, which a
// Tailwind class string can't drive, so the same three rank colors need a
// hex form here too.
const MEDAL_HEX: Record<1 | 2 | 3, string> = {
  1: "#fbbf24",
  2: "#94a3b8",
  3: "#b45309",
};

// Each box's own fill-in (fade + pop) once its rank's reveal begins -- short
// and fixed regardless of that rank's points count-up weight, since it's just
// the content container arriving into an already-positioned, already-visible
// slot. The count-up itself (much longer for 1st) is what carries the weight
// difference between ranks, not this pop.
const BOX_POP_MS = 220;

function resolveStageInstantStyle(
  phase: PodiumStageState["phase"],
  elapsedMs: number,
  event: PodiumEvent | null,
): { y: number; scale: number } {
  if (!event || phase === "stage") {
    if (!event) return { y: OFF_FRAME_Y, scale: STAGE_ENTER_SCALE };

    const riseLocal = Math.min(elapsedMs, event.riseMs);
    const riseEased = easeOutQuart(clamp01(riseLocal / event.riseMs));
    const y = OFF_FRAME_Y + (0 - OFF_FRAME_Y) * riseEased;

    const expandLocal = Math.max(0, elapsedMs - event.riseMs);
    const expandEased = easeOutQuart(clamp01(expandLocal / event.expandMs));
    const scale = STAGE_ENTER_SCALE + (STAGE_FULL_SCALE - STAGE_ENTER_SCALE) * expandEased;

    return { y, scale };
  }

  // Any phase past "stage": fully risen and expanded.
  return { y: 0, scale: STAGE_FULL_SCALE };
}

function resolveBoxInstant(rankPhase: PodiumRankPhase, localElapsedMs: number): { opacity: number; scale: number } {
  if (rankPhase === "pending") return { opacity: 0, scale: 0.85 };
  if (rankPhase === "revealed") return { opacity: 1, scale: 1 };
  const eased = easeOutQuart(clamp01(localElapsedMs / BOX_POP_MS));
  return { opacity: eased, scale: 0.85 + (1 - 0.85) * eased };
}

function rankPhaseFor(state: PodiumStageState, rank: 1 | 2 | 3): PodiumRankPhase {
  if (rank === 3) return state.rank3;
  if (rank === 2) return state.rank2;
  return state.rank1;
}

function rankLocalElapsedMs(state: PodiumStageState, rank: 1 | 2 | 3): number {
  if (rank === 3 && state.phase === "third") return state.elapsedMs;
  if (rank === 2 && state.phase === "second") return state.elapsedMs;
  if (rank === 1 && state.phase === "first") return state.elapsedMs;
  return 0;
}

function rankCountUpMs(event: PodiumEvent, rank: 1 | 2 | 3): number {
  if (rank === 3) return event.thirdCountUpMs;
  if (rank === 2) return event.secondCountUpMs;
  return event.firstCountUpMs;
}

/**
 * Ms since this rank's count-up finished (i.e. since it "landed"), or null
 * while it's still pending/counting, or once the state has moved on to
 * announcing a later rank -- state.elapsedMs only carries this rank's own
 * timeline while state.phase still equals its own announce phase (see
 * resolvePodiumStateAt's frozen-elapsedMs return during the gap before the
 * next rank), so once phase advances there's no "time since" left to derive
 * and the shimmer is simply treated as already having played out. Drives the
 * "this is you" shimmer below -- fires once, right as that box lands, well
 * within its own (much longer) hold.
 */
function rankRevealedElapsedMs(state: PodiumStageState, rank: 1 | 2 | 3, countUpMs: number): number | null {
  const isOwnPhase =
    (rank === 3 && state.phase === "third") ||
    (rank === 2 && state.phase === "second") ||
    (rank === 1 && state.phase === "first");
  if (!isOwnPhase) return null;

  const sinceRevealed = state.elapsedMs - countUpMs;
  return sinceRevealed >= 0 ? sinceRevealed : null;
}

/**
 * A single podium box, announced directly into its final slot -- no
 * reveal-elsewhere-then-relocate step. The bordered platform shape is always
 * visible once the stage has risen (the "empty 3-box podium shape"); the
 * name/points/rank-number content only pops in once this box's own rank
 * phase leaves "pending".
 */
function PodiumBox({
  entries,
  rank,
  rankPhase,
  localElapsedMs,
  countUpMs,
  shimmerElapsedMs,
  playbackRate,
}: {
  /** Whoever holds this rank -- 0 entries means nobody does (a legitimate
   *  gap, e.g. a tie for 2nd leaves no one at rank 3), 2+ means a tie for
   *  this rank, and every one of them must render, not just one. */
  entries: PodiumBoxEntry[];
  rank: 1 | 2 | 3;
  rankPhase: PodiumRankPhase;
  localElapsedMs: number;
  countUpMs: number;
  /** Ms since this box landed, for the viewer's own box's shimmer -- see
   *  rankRevealedElapsedMs. Ignored for every other box. */
  shimmerElapsedMs: number | null;
  playbackRate: number;
}) {
  // Tied entries land on the same rank because they share the same total by
  // construction, so a single "primary" stands in for box-level theming
  // (glow/border tint, the one shared count-up) while every entry still gets
  // its own name line below.
  const primary = entries[0] as PodiumBoxEntry | undefined;

  const opacity = useMotionValue(0);
  const scale = useMotionValue(0.85);
  // Soft medal-color glow, derived from the box's own pop-in opacity rather
  // than a separate motion value/effect -- it just blooms in alongside the
  // box's arrival for free.
  const glow = useTransform(opacity, (o) => `0 0 ${32 * o}px ${MEDAL_HEX[rank]}40`);
  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  const countUpPhase: CountUpPhase =
    rankPhase === "counting" ? "counting" : rankPhase === "revealed" ? "settled" : "zero";
  const roundedPoints = useCountUpValue({
    target: primary?.points ?? 0,
    phase: countUpPhase,
    localElapsedMs: rankPhase === "counting" ? localElapsedMs : 0,
    durationMs: countUpMs,
    playbackRate,
  });

  useEffect(() => {
    controlsRef.current.forEach((controls) => controls.stop());
    controlsRef.current = [];

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    const instant = resolveBoxInstant(rankPhase, localElapsedMs);
    opacity.set(instant.opacity);
    scale.set(instant.scale);

    if (rankPhase !== "counting" || localElapsedMs >= BOX_POP_MS) return;

    const remaining = BOX_POP_MS - localElapsedMs;
    controlsRef.current = [
      animate(opacity, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(scale, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      controlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankPhase, localElapsedMs, playbackRate]);

  const heightClassName = CEREMONIAL_HEIGHT[rank];

  // The pedestal shell (shape/height/border) always renders, even when
  // nobody holds this rank -- e.g. a tie for 2nd legitimately leaves rank 3
  // empty. Only the occupant content (name(s), points, glow, shimmer) is
  // conditional, so an unoccupied rank reads as an empty pedestal rather
  // than collapsing to blank space. There's no "landing" to announce for an
  // empty slot, so it's rendered fully static rather than wired into the
  // per-rank pop-in animation.
  if (!primary) {
    return (
      <div className="flex flex-1 min-w-0 flex-col items-center gap-3">
        <div className="flex min-w-0 max-w-full flex-col items-center gap-1">
          <p className="max-w-full truncate font-heading text-lg font-bold text-white/30 sm:text-2xl">{NO_DATA}</p>
        </div>
        <div
          className={cn(
            "relative flex w-full items-start justify-center overflow-hidden rounded-t-2xl border border-white/10 bg-white/5 pt-4",
            heightClassName,
          )}
        >
          <span className="relative font-mono text-5xl font-black text-white/30 sm:text-7xl">{rank}</span>
        </div>
      </div>
    );
  }

  // Rank digit and points count-up both take the medal (gold/silver/bronze)
  // color -- the universal achievement-tier signal, matching the real page's
  // Podium.tsx. The box's own landing shimmer (TeamColorShimmer, below) uses
  // that same medal color for the viewer's own box, rather than team color.
  const medalTextColor = medalColor[rank] ?? "text-white";
  // Whichever tied occupant is the viewer, if any -- drives the "this is
  // you" shimmer, played in the rank's medal color.
  const meEntry = entries.find((e) => e.isMe);

  return (
    <div className="flex flex-1 min-w-0 flex-col items-center gap-3">
      <motion.div style={{ opacity, scale }} className="flex min-w-0 max-w-full flex-col items-center gap-1">
        {entries.map((entry) => (
          <div key={entry.userId} className="flex min-w-0 max-w-full flex-col items-center">
            <div className="flex min-w-0 max-w-full items-baseline gap-1.5">
              {entries.length > 1 && (
                <span aria-hidden="true" className="shrink-0 text-xs leading-none text-white/50 sm:text-sm">
                  •
                </span>
              )}
              <p className="min-w-0 max-w-full truncate font-heading text-lg font-bold text-white sm:text-2xl">
                {entry.name}
              </p>
            </div>
            <p className="max-w-full truncate text-xs font-semibold sm:text-sm" style={{ color: entry.color }}>
              {entry.teamName}
            </p>
          </div>
        ))}
        <motion.p className={cn("font-mono text-2xl font-black tabular-nums sm:text-4xl", medalTextColor)}>
          {roundedPoints}
        </motion.p>
      </motion.div>
      <motion.div
        style={{
          backgroundColor: `${MEDAL_HEX[rank]}1a`,
          borderColor: `${MEDAL_HEX[rank]}66`,
          boxShadow: glow,
        }}
        className={cn(
          "relative flex w-full items-start justify-center overflow-hidden rounded-t-2xl border pt-4",
          heightClassName,
        )}
      >
        {meEntry && <TeamColorShimmer color={MEDAL_HEX[rank]} elapsedMs={shimmerElapsedMs} playbackRate={playbackRate} />}
        <motion.span
          style={{ opacity, scale }}
          className={cn("relative font-mono text-5xl font-black sm:text-7xl", medalTextColor)}
        >
          {rank}
        </motion.span>
      </motion.div>
    </div>
  );
}

export function PodiumStage({ state, playbackRate }: PodiumStageProps) {
  const { event, phase, elapsedMs } = state;

  const initial = resolveStageInstantStyle(phase, elapsedMs, event);
  const y = useMotionValue(initial.y);
  const scale = useMotionValue(initial.scale);
  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    controlsRef.current.forEach((controls) => controls.stop());
    controlsRef.current = [];

    if (!event) return;

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingMs: number) => Math.max(remainingMs, 0) / rate / 1000;

    const instant = resolveStageInstantStyle(phase, elapsedMs, event);
    y.set(instant.y);
    scale.set(instant.scale);

    if (phase !== "stage") return;

    if (elapsedMs < event.riseMs) {
      const remainingRise = event.riseMs - elapsedMs;
      controlsRef.current.push(animate(y, 0, { duration: toSeconds(remainingRise), ease: EASE_HARD_DECEL }));
      // Scale doesn't start growing until the rise finishes -- delay covers
      // whatever's left of the rise from wherever we seeded in above.
      controlsRef.current.push(
        animate(scale, STAGE_FULL_SCALE, {
          delay: toSeconds(remainingRise),
          duration: toSeconds(event.expandMs),
          ease: EASE_HARD_DECEL,
        }),
      );
    } else {
      const expandLocal = elapsedMs - event.riseMs;
      const remainingExpand = event.expandMs - expandLocal;
      if (remainingExpand > 0) {
        controlsRef.current.push(
          animate(scale, STAGE_FULL_SCALE, { duration: toSeconds(remainingExpand), ease: EASE_HARD_DECEL }),
        );
      }
    }

    return () => {
      controlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, phase, elapsedMs, playbackRate]);

  if (!event) return null;

  const byRank = groupEntriesByRank(event.entries);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <motion.div
        style={{ y, scale }}
        className="flex w-full max-w-4xl items-end justify-center gap-4"
      >
        {PLATFORM_ORDER.map((rank) => (
          <PodiumBox
            key={rank}
            entries={byRank.get(rank) ?? []}
            rank={rank}
            rankPhase={rankPhaseFor(state, rank)}
            localElapsedMs={rankLocalElapsedMs(state, rank)}
            countUpMs={rankCountUpMs(event, rank)}
            shimmerElapsedMs={rankRevealedElapsedMs(state, rank, rankCountUpMs(event, rank))}
            playbackRate={playbackRate}
          />
        ))}
      </motion.div>
    </div>
  );
}
