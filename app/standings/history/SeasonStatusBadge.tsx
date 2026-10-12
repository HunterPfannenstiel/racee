export function SeasonStatusBadge({ status }: { status: "complete" | "ended" | "in_progress" }) {
  const text = status === "in_progress" ? "In progress" : status === "ended" ? "Final" : "Complete";
  const tone = status === "in_progress" ? "text-primary border-primary/50" : "text-muted-foreground border-border";
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-sm border ${tone}`}>
      {text}
    </span>
  );
}
