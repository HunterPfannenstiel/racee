"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Reads/writes the four identifiers this page is scoped by. leagueId/raceId
 * never change in-session (the page is scoped to one race); leftUserId/
 * rightUserId are mutable so stepping/jumping stays a shareable URL rather
 * than local state. Writes use router.replace so rapid stepper taps don't
 * spam browser history.
 */
export function usePvpSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const leagueId = searchParams.get("leagueId");
  const raceId = searchParams.get("raceId");
  const leftUserId = searchParams.get("leftUserId");
  const rightUserId = searchParams.get("rightUserId");

  const setParam = useCallback(
    (key: "leftUserId" | "rightUserId", value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Setting left and right independently (two setParam calls) would race:
  // each rebuilds from the same stale searchParams snapshot, so the second
  // router.replace clobbers the first's change. Swapping needs both written
  // in one URLSearchParams object / one replace call.
  const setUserIds = useCallback(
    (left: string, right: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("leftUserId", left);
      params.set("rightUserId", right);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return {
    leagueId,
    raceId,
    leftUserId,
    rightUserId,
    setLeftUserId: useCallback((userId: string) => setParam("leftUserId", userId), [setParam]),
    setRightUserId: useCallback((userId: string) => setParam("rightUserId", userId), [setParam]),
    setUserIds,
  };
}
