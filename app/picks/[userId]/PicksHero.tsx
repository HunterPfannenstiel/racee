type Props = {
  totalPoints: number;
  rank: number | null;
  totalParticipants: number;
  gridPoints: number;
  propPoints: number;
};

export function PicksHero({ totalPoints, rank, totalParticipants, gridPoints, propPoints }: Props) {
  return (
    <div className="flex flex-col items-center py-6 space-y-1">
      <p className="text-2xl font-mono font-bold text-primary tabular-nums">
        {totalPoints} PTS
      </p>
      {rank !== null && (
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          #{rank} OF {totalParticipants}
        </p>
      )}
      <p className="text-xs font-mono text-tertiary">
        {gridPoints} grid · {propPoints} props
      </p>
    </div>
  );
}
