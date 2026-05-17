import { type Season } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = {
  seasons: Season[];
  selectedSeasonId: string | null;
  onSelect: (id: string) => void;
};

export function SeasonPicker({ seasons, selectedSeasonId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {seasons.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors",
            selectedSeasonId === s.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
