"use client";

import { useEffect, useState } from "react";

type UseRaceLockParams = {
  lockTime?: string;
  keyIsSet: boolean;
  bypassLock?: boolean;
};

type UseRaceLockResult = {
  isLocked: boolean;
  countdown: string | null;
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function useRaceLock({ lockTime, keyIsSet, bypassLock = false }: UseRaceLockParams): UseRaceLockResult {
  const [isLocked, setIsLocked] = useState(() =>
    !bypassLock && (keyIsSet || (!!lockTime && Date.now() >= new Date(lockTime).getTime()))
  );
  const [countdown, setCountdown] = useState<string | null>(() => {
    if (bypassLock || !lockTime) return null;
    const ms = new Date(lockTime).getTime() - Date.now();
    return ms > 0 ? formatCountdown(ms) : null;
  });

  useEffect(() => {
    if (bypassLock) {
      setIsLocked(false);
      setCountdown(null);
      return;
    }
    if (keyIsSet) {
      setIsLocked(true);
      setCountdown(null);
      return;
    }
    if (!lockTime) {
      setIsLocked(false);
      setCountdown(null);
      return;
    }
    function tick() {
      const ms = new Date(lockTime!).getTime() - Date.now();
      if (ms <= 0) {
        setIsLocked(true);
        setCountdown(null);
      } else {
        setIsLocked(false);
        setCountdown(formatCountdown(ms));
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockTime, keyIsSet, bypassLock]);

  return { isLocked, countdown };
}
