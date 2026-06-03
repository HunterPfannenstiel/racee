import type { PlayerIdentityDTO, PlayerSummaryDTO } from "@/server/queries/user-profile-stats/IUserProfileStatsQuery";

interface PlayerHeaderProps {
  player: PlayerIdentityDTO;
  summary: PlayerSummaryDTO;
}

export function PlayerHeader({ player, summary }: PlayerHeaderProps) {
  const accuracyPct = (summary.overallPropAccuracy * 100).toFixed(1);
  const initial = player.name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-4">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt={player.name}
            className="w-16 h-16 rounded-full border border-border object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-subtle border border-border flex items-center justify-center flex-shrink-0">
            <span className="font-heading text-2xl text-foreground leading-none">{initial}</span>
          </div>
        )}
        <div>
          <p className="font-heading text-3xl font-bold text-foreground leading-tight">{player.name}</p>
        </div>
      </div>

      <div>
        <p className="font-heading text-5xl font-bold text-primary leading-none tabular-nums">
          {accuracyPct}
          <span className="text-3xl">%</span>
        </p>
        <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mt-1">
          Prop Accuracy
        </p>
      </div>
    </div>
  );
}
