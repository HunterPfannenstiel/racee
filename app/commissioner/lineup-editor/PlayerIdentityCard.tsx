import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type PlayerIdentityCardProps = {
  name: string;
  avatarUrl?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function PlayerIdentityCard({ name, avatarUrl }: PlayerIdentityCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
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
