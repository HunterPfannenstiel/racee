import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaguePlayerAvatar } from "@/components/avatar/LeaguePlayerAvatar";

type PlayerIdentityCardProps = {
  userId: string;
  name: string;
};

export function PlayerIdentityCard({ userId, name }: PlayerIdentityCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <LeaguePlayerAvatar userId={userId} name={name} size="lg" />
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold text-foreground">{name}</span>
            <Badge className="bg-amber-400 text-amber-950">Commissioner Mode</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Changes are saved when you press Submit below. The score recalculates immediately
          upon save and updates the league standings.
        </p>
      </CardContent>
    </Card>
  );
}
