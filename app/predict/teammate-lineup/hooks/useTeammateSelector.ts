"use client";

import { useState, useCallback } from "react";

export type Teammate = {
  id: string;
  name: string;
};

type UseTeammateSelectorReturn = {
  selectedPlayerId: string | null;
  displayName: string;
  isProxy: boolean;
  next: () => void;
  prev: () => void;
};

export function useTeammateSelector(
  teammates: Teammate[]
): UseTeammateSelectorReturn {
  const [index, setIndex] = useState(-1);

  const total = teammates.length + 1;

  const next = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      return next >= teammates.length ? -1 : next;
    });
  }, [teammates.length]);

  const prev = useCallback(() => {
    setIndex((i) => {
      const prev = i - 1;
      return prev < -1 ? teammates.length - 1 : prev;
    });
  }, [teammates.length]);

  const isYou = index === -1;
  const selectedPlayerId = isYou ? null : teammates[index]?.id ?? null;
  const displayName = isYou ? "You" : teammates[index]?.name ?? "You";

  return {
    selectedPlayerId,
    displayName,
    isProxy: !isYou,
    next: total > 1 ? next : () => {},
    prev: total > 1 ? prev : () => {},
  };
}
