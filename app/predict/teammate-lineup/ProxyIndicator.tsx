"use client";

type ProxyIndicatorProps = {
  targetName: string;
};

export function ProxyIndicator({ targetName }: ProxyIndicatorProps) {
  return (
    <p className="text-xs font-mono uppercase tracking-[0.08em] text-state-upcoming text-center">
      Setting lineup for: {targetName}
    </p>
  );
}
