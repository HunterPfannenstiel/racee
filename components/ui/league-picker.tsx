import { type League } from "@/lib/schemas";
import { Button } from "@/components/ui/button";

type Props = {
  leagues: League[];
  selectedLeagueId: string | null;
  onSelect: (id: string) => void;
};

export function LeaguePicker({ leagues, selectedLeagueId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {leagues.map((s) => (
        <Button
          key={s.id}
          size="xs"
          variant={selectedLeagueId === s.id ? "default" : "ghost"}
          onClick={() => onSelect(s.id)}
        >
          {s.name}
        </Button>
      ))}
    </div>
  );
}
