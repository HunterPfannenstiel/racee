import type { PlayerIdentityDTO, PlayerSummaryDTO } from "@/server/queries/user-profile-stats/IUserProfileStatsQuery";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";

interface PlayerHeaderProps {
  player: PlayerIdentityDTO;
  summary: PlayerSummaryDTO;
}

export function PlayerHeader({ player, summary }: PlayerHeaderProps) {
  const accuracyPct = (summary.overallPropAccuracy * 100).toFixed(1);

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-4">
        <LeaguePlayerAvatar userId={player.userId} name={player.name} size="xl" action="zoom" />
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
