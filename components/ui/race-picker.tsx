import { type Race } from "@/lib/schemas";
import { Button } from "@/components/ui/button";

type Props = {
  races: Race[];
  selectedRaceId: string | null;
  onSelect: (id: string) => void;
};

export function RacePicker({ races, selectedRaceId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {races.map((r) => (
        <Button
          key={r.id}
          size="xs"
          variant={selectedRaceId === r.id ? "default" : "ghost"}
          onClick={() => onSelect(r.id)}
        >
          {r.title}
        </Button>
      ))}
    </div>
  );
}
