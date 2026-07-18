"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import { RaceBug, RACE_BUG_REST_TOP_PCT, RACE_BUG_REST_LEFT_PCT } from "./RaceBug";
import type { EstablishingCardEvent, EstablishingCardState } from "./beats/establishing";

// Hard-decelerating, never-overshoots easing -- duplicated from GroupStage
// (not exported there) to keep the two Stages' motion feel consistent.
const EASE_HARD_DECEL: [number, number, number, number] = [0.25, 1, 0.5, 1];
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

const BIG_SCALE = 3.6;
const APPEAR_RISE_Y = 20;
const CENTER_PCT = 50;

// Target *effective* (post-transform) max-width, in vw, for the race/league
// name text -- held constant across the whole appear->hold->demote animation
// by dividing it back out through the live `scale` motion value below,
// rather than applying one static pre-transform max-width class everywhere.
// A static class sized safe for the big BIG_SCALE appear/hold card (e.g.
// 24vw, safe because 24 * 3.6 ~= 86vw) is WAY too narrow once the card
// shrinks back down to scale 1 in the small corner rest state -- 24vw would
// then mean literally 24% of the viewport, truncating names that trivially
// fit at that size. Deriving max-width as NAME_TARGET_VISUAL_VW / scale
// keeps the same ~86vw safety margin at every point of the animation,
// including exactly at rest (scale 1 -> ~86vw, plenty of room). Rather than
// shrinking the font to fit (the old fluid-font-size.ts approach, which
// broke on real devices when the webfont hadn't finished loading yet -- see
// fluid-font-size.ts's removal), long names are simply truncated with an
// ellipsis as a safety net, matching how the real results Podium handles
// long names.
const NAME_TARGET_VISUAL_VW = 24 * BIG_SCALE;

// Horizontal anchor fraction, driven through the standalone CSS `translate`
// property (Tailwind v4's `-translate-x-1/2` also targets this property, NOT
// `transform`) -- NOT a CSS percent-of-viewport position, that's `left`.
// Per the CSS Transforms spec, the individual `translate`/`rotate`/`scale`
// properties are composed *before* the `transform` property, so driving the
// anchor here (rather than via Motion's `x`, which folds into `transform`
// alongside our `scale` motion value) keeps the percentage anchoring
// well-defined independent of the concurrently-animating scale -- exactly
// matching how the vertical `-translate-y-1/2` class already behaves.
// At CENTER_ANCHOR_PCT the container is centered on its `left` point; at
// REST_ANCHOR_PCT the container's own left edge sits exactly at its `left`
// point, i.e. left-anchored, so it grows rightward from the corner instead
// of symmetrically off both sides. Interpolating between the two during
// "demote" (rather than snapping) is what keeps a long race/league name from
// clipping off the left edge of the viewport once it reaches the small
// corner rest position -- see resolveInstantStyle's demote branch.
const CENTER_ANCHOR_PCT = -50;
const REST_ANCHOR_PCT = 0;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

type InstantStyle = {
  top: number;
  left: number;
  xAnchorPct: number;
  scale: number;
  opacity: number;
  y: number;
  leagueOpacity: number;
};

/**
 * The single source of truth for "what does this look like right now" given
 * a phase/elapsedMs -- used both to seed this component's motion values (so
 * a fresh mount at an arbitrary `t`, e.g. persistent-layer mount or a scrub
 * that lands deep into "demote"/beyond, renders the correct instantaneous
 * frame immediately) and, in the effect below, as the pre-`animate()`
 * `.set()` target. Keeping both call sites derived from this one function is
 * what guarantees they can't drift apart.
 */
function resolveInstantStyle(
  phase: EstablishingCardState["phase"],
  elapsedMs: number,
  event: EstablishingCardEvent | null,
): InstantStyle {
  if (!event || phase === "appear") {
    const eased = event ? easeOutQuart(clamp01(elapsedMs / event.appearMs)) : 0;
    return {
      top: CENTER_PCT,
      left: CENTER_PCT,
      xAnchorPct: CENTER_ANCHOR_PCT,
      scale: BIG_SCALE,
      opacity: eased,
      y: APPEAR_RISE_Y + (0 - APPEAR_RISE_Y) * eased,
      leagueOpacity: 1,
    };
  }

  if (phase === "hold") {
    return {
      top: CENTER_PCT,
      left: CENTER_PCT,
      xAnchorPct: CENTER_ANCHOR_PCT,
      scale: BIG_SCALE,
      opacity: 1,
      y: 0,
      leagueOpacity: 1,
    };
  }

  // phase === "demote"
  const eased = easeOutQuart(clamp01(elapsedMs / event.demoteMs));
  return {
    top: CENTER_PCT + (RACE_BUG_REST_TOP_PCT - CENTER_PCT) * eased,
    left: CENTER_PCT + (RACE_BUG_REST_LEFT_PCT - CENTER_PCT) * eased,
    xAnchorPct: CENTER_ANCHOR_PCT + (REST_ANCHOR_PCT - CENTER_ANCHOR_PCT) * eased,
    scale: BIG_SCALE + (1 - BIG_SCALE) * eased,
    opacity: 1,
    y: 0,
    leagueOpacity: 1 - eased,
  };
}

type EstablishingCardStageProps = {
  state: EstablishingCardState;
  playbackRate: number;
};

export function EstablishingCardStage({
  state: { event, phase, elapsedMs },
  playbackRate,
}: EstablishingCardStageProps) {
  // useMotionValue only ever consumes this argument on the instance's first
  // render (later renders just re-read the same motion value), so computing
  // it plainly here -- rather than hardcoded "appear, just started" literals
  // -- is enough to seed a fresh mount at any `t` with the correct frame.
  const initial = resolveInstantStyle(phase, elapsedMs, event);

  const top = useMotionValue(initial.top);
  const left = useMotionValue(initial.left);
  const xAnchor = useMotionValue(initial.xAnchorPct);
  const scale = useMotionValue(initial.scale);
  const opacity = useMotionValue(initial.opacity);
  const y = useMotionValue(initial.y);
  const leagueOpacity = useMotionValue(initial.leagueOpacity);

  const topPct = useTransform(top, (v) => `${v}%`);
  const leftPct = useTransform(left, (v) => `${v}%`);
  // Full `translate` shorthand (x y): x is the phase-driven anchor, y stays
  // pinned at -50% (vertical centering) always -- see xAnchor's comment.
  const translatePct = useTransform(xAnchor, (v) => `${v}% -50%`);
  // Tracks `scale` automatically (no separate imperative animate() needed) --
  // see NAME_TARGET_VISUAL_VW's comment.
  const nameMaxWidth = useTransform(scale, (s) => `${(NAME_TARGET_VISUAL_VW / s).toFixed(2)}vw`);

  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    controlsRef.current.forEach((controls) => controls.stop());
    controlsRef.current = [];

    if (!event) return;

    const rate = playbackRate > 0 ? playbackRate : 1;
    const toSeconds = (remainingCanonicalMs: number) => Math.max(remainingCanonicalMs, 0) / rate / 1000;

    // Snap every motion value to the exact instantaneous frame for the
    // current phase/elapsedMs before animating the remainder -- this is what
    // makes an arbitrary-t jump (scrub, or a fresh mount deep into "demote")
    // render correctly on the very next paint instead of replaying from 0.
    const instant = resolveInstantStyle(phase, elapsedMs, event);
    top.set(instant.top);
    left.set(instant.left);
    xAnchor.set(instant.xAnchorPct);
    scale.set(instant.scale);
    opacity.set(instant.opacity);
    y.set(instant.y);
    leagueOpacity.set(instant.leagueOpacity);

    if (phase === "appear") {
      const remaining = event.appearMs - elapsedMs;
      controlsRef.current = [
        animate(opacity, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
        animate(y, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      ];
      return;
    }

    if (phase === "hold") {
      return;
    }

    // phase === "demote"
    const remaining = event.demoteMs - elapsedMs;
    controlsRef.current = [
      animate(top, RACE_BUG_REST_TOP_PCT, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(left, RACE_BUG_REST_LEFT_PCT, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(xAnchor, REST_ANCHOR_PCT, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(scale, 1, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
      animate(leagueOpacity, 0, { duration: toSeconds(remaining), ease: EASE_HARD_DECEL }),
    ];

    return () => {
      controlsRef.current.forEach((controls) => controls.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, phase, elapsedMs, playbackRate]);

  if (!event) return null;

  // "appear"/"hold" are the big centered card -- children stack centered
  // around the shared midpoint. "demote" (and its settled-forever terminal
  // frame) is the small corner badge -- left-anchored (see xAnchor above), so
  // children must also left-align within the container instead of centering,
  // or the narrower league-name line would float off-center relative to the
  // anchored race title. This switches in lockstep with xAnchor starting to
  // animate off CENTER_ANCHOR_PCT, i.e. exactly when demote begins.
  const isCorner = phase === "demote";

  return (
    <motion.div
      style={{ top: topPct, left: leftPct, translate: translatePct, scale, opacity, y }}
      className={`fixed flex min-w-0 flex-col gap-1 ${
        isCorner ? "items-start text-left" : "items-center text-center"
      }`}
    >
      <RaceBug raceName={event.raceName} style={{ maxWidth: nameMaxWidth }} />
      <motion.p
        style={{ opacity: leagueOpacity, maxWidth: nameMaxWidth }}
        className="min-w-0 truncate font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {event.leagueName}
      </motion.p>
    </motion.div>
  );
}
