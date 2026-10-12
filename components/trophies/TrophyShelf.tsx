"use client";

import { useState } from "react";
import { ChevronDownIcon, EyeOffIcon } from "lucide-react";
import { cn, formatPoints } from "@/lib/utils";
import { addMedalCounts, emptyMedalCounts, MEDAL_LABEL, type Medal, type MedalCounts } from "@/lib/medals";
import { AwardTally, MedalIcon, TrophyIcon } from "./AwardIcons";

export type ShelfSeason = {
  seasonId: string;
  label: string;
  status: "complete" | "ended" | "in_progress";
  rank: number | null;
  total: number;
  trophy: Medal | null;
  trophyKey: string;
  trophyHidden: boolean;
  medals: MedalCounts;
  medalDetails: { raceId: string; raceLabel: string; date: string; medal: Medal; points: number }[];
  raceWins: number;
};

export type ShelfLeague = {
  leagueId: string;
  name: string;
  viewerIsMember: boolean;
  hidden: boolean;
  seasons: ShelfSeason[];
};

function trophyCounts(seasons: ShelfSeason[]): MedalCounts {
  const c = emptyMedalCounts();
  for (const s of seasons) if (s.trophy) c[s.trophy]++;
  return c;
}

const medalCounts = (seasons: ShelfSeason[]) => seasons.reduce((c, s) => addMedalCounts(c, s.medals), emptyMedalCounts());

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** One season on the shelf: its trophy and medal count; tap to see every medal. */
function SeasonRow({ season, leagueName }: { season: ShelfSeason; leagueName?: string }) {
  const [open, setOpen] = useState(false);
  const hasDetails = season.medalDetails.length > 0;
  const status = season.status === "in_progress" ? "in progress" : season.status === "ended" ? "final" : null;
  return (
    <div className="border-t border-border/50 first:border-t-0">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left", hasDetails && "hover:bg-subtle")}
        aria-expanded={hasDetails ? open : undefined}
      >
        <span className="w-6 shrink-0">
          {season.trophy ? (
            <TrophyIcon
              medal={season.trophy}
              className="size-6"
              title={`${MEDAL_LABEL[season.trophy]} trophy – ${season.label}${leagueName ? `, ${leagueName}` : ""}, ${formatPoints(season.total)} pts`}
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {season.label}
            {leagueName && <span className="truncate text-xs font-normal text-muted-foreground">· {leagueName}</span>}
            {season.trophyHidden && <EyeOffIcon className="size-3 text-muted-foreground" aria-label="Hidden from others" />}
          </span>
          <span className="block text-xs text-muted-foreground">
            {season.rank !== null ? `${ordinal(season.rank)} · ` : ""}
            {formatPoints(season.total)} pts{status ? ` · ${status}` : ""}
          </span>
        </span>
        <AwardTally counts={season.medals} hideZeros />
        {hasDetails && <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />}
      </button>
      {open && (
        <ul className="space-y-1 px-3 pb-3 pl-12">
          {season.medalDetails.map((d) => (
            <li key={d.raceId} className="flex items-center gap-2 text-xs">
              <MedalIcon medal={d.medal} className="size-4" />
              <span className="font-semibold">{MEDAL_LABEL[d.medal]}</span>
              <span className="min-w-0 flex-1 truncate">
                {d.raceLabel} {season.label}
                {leagueName ? `, ${leagueName}` : ""}
              </span>
              <span className="tabular-nums text-muted-foreground">{formatPoints(d.points)} pts</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Summary({ seasons }: { seasons: ShelfSeason[] }) {
  const wins = seasons.reduce((n, s) => n + s.raceWins, 0);
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-sm border border-border bg-card px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Trophies</p>
        <AwardTally counts={trophyCounts(seasons)} kind="trophy" size="md" />
      </div>
      <div className="rounded-sm border border-border bg-card px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Medals</p>
        <AwardTally counts={medalCounts(seasons)} size="md" />
      </div>
      <div className="rounded-sm border border-border bg-card px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Race wins</p>
        <p className="font-heading text-xl font-bold tabular-nums">{wins}</p>
      </div>
    </div>
  );
}

/**
 * The player's trophy shelf: season trophies and race medals, for one league
 * (`leagueId`) or every league they've played in.
 */
export function TrophyShelf({ leagues, leagueId }: { leagues: ShelfLeague[]; leagueId: string | null }) {
  const shown = leagueId ? leagues.filter((l) => l.leagueId === leagueId) : leagues;
  const allSeasons = shown.flatMap((l) => l.seasons);

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trophy shelf</h2>
      <Summary seasons={allSeasons} />
      {allSeasons.length === 0 ? (
        <p className="text-xs text-muted-foreground">No races scored yet.</p>
      ) : leagueId ? (
        <div className="rounded-sm border border-border">
          {allSeasons.map((s) => (
            <SeasonRow key={s.seasonId} season={s} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((l) => (
            <div key={l.leagueId} className="rounded-sm border border-border">
              <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{l.name}</span>
                {l.hidden && <EyeOffIcon className="size-3.5 text-muted-foreground" aria-label="Hidden from others" />}
                <AwardTally counts={trophyCounts(l.seasons)} kind="trophy" hideZeros />
              </div>
              {l.seasons.map((s) => (
                <SeasonRow key={s.seasonId} season={s} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
