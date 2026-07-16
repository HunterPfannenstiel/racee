"use client";

import { Suspense } from "react";
import { notFound, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { QueryLoading, QueryError } from "@/components/ui/query-state";
import { usePvpSearchParams } from "./hooks/usePvpSearchParams";
import { usePlayerVsPlayer } from "./hooks/usePlayerVsPlayer";
import { PlayerVsPlayerView } from "./PlayerVsPlayerView";

// Exhaustiveness guard for the switch below -- if UsePlayerVsPlayerResult
// ever grows a new status variant, this becomes a compile error at the
// `default` branch's call site instead of a silently-unhandled state.
function assertNever(x: never): never {
  throw new Error(`Unhandled status: ${JSON.stringify(x)}`);
}

// This page is reachable as a standalone shared link (publicProcedure, no
// league-scoped nav), so there's no single "results page for this race" href
// to hardcode -- router.back() returns wherever the viewer actually came
// from, falling back to /results only when there's no history to unwind
// (e.g. the link was opened fresh from a share).
function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/results"))}
      className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-3.5" />
      Back
    </button>
  );
}

// Publicly viewable (no RequireUser) -- see server/rpc/procedures.ts's
// publicProcedure. leagueId/raceId/leftUserId/rightUserId are all required;
// a link missing any of them is malformed, not a loading state.
export default function PlayerVsPlayerPage() {
  return (
    <Suspense
      fallback={
        <PageShell title="Player vs Player">
          <BackLink />
          <QueryLoading label="Loading comparison..." />
        </PageShell>
      }
    >
      <PlayerVsPlayerPageContent />
    </Suspense>
  );
}

// usePvpSearchParams() calls useSearchParams(), which requires a Suspense
// boundary above it (or Next bails the whole route out of static rendering) --
// kept as a separate component so the boundary above sits above this hook call.
function PlayerVsPlayerPageContent() {
  const { leagueId, raceId, leftUserId, rightUserId } = usePvpSearchParams();
  if (!leagueId || !raceId || !leftUserId || !rightUserId) notFound();

  const vm = usePlayerVsPlayer();
  const subtitle = vm.status === "ready" ? vm.comparison.raceTitle : undefined;

  return (
    <PageShell title="Player vs Player" subtitle={subtitle}>
      <BackLink />
      {renderContent(vm)}
    </PageShell>
  );
}

function renderContent(vm: ReturnType<typeof usePlayerVsPlayer>) {
  switch (vm.status) {
    case "loading":
      return <QueryLoading label="Loading comparison..." />;

    case "error":
      return <QueryError error={vm.error} onRetry={vm.onRetry} />;

    case "not-found":
      return (
        <p className="text-sm text-muted-foreground">
          One of these players isn&apos;t in this league for this race. Double-check the link.
        </p>
      );

    case "not-submitted":
      return (
        <p className="text-sm text-muted-foreground">
          One or both players haven&apos;t submitted picks for this race yet.
        </p>
      );

    case "ready":
      return <PlayerVsPlayerView {...vm} />;

    default:
      return assertNever(vm);
  }
}
