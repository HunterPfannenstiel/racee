import { z } from "zod";
import { computeGridPoints, computePropPoints, assignMedals } from "@/lib/scoring";
import type { League } from "./league";
import type { Race } from "./race";

export const PropNameSchema = z.enum([
  "driverOfDay", "lapsLed", "fastestPitStop", "fastestLap",
  "overAchiever", "underAchiever", "wrecker",
]);
export type PropName = z.infer<typeof PropNameSchema>;

export const PropKeySchema = z.object({
  driverOfDay: z.array(z.string()).nullable(),
  lapsLed: z.array(z.string()).nullable(),
  fastestPitStop: z.array(z.string()).nullable(),
  fastestLap: z.array(z.string()).nullable(),
  overAchiever: z.array(z.string()).nullable(),
  underAchiever: z.array(z.string()).nullable(),
  wrecker: z.array(z.string()).nullable(),
});
export type PropKey = z.infer<typeof PropKeySchema>;

const UserPredictionPropsSchema = z.object({
  userId: z.string().min(1),
  racerIds: z.array(z.string().uuid()).min(1),
  propPicks: z.object({
    driverOfDay: z.string().optional(),
    lapsLed: z.string().optional(),
    fastestPitStop: z.string().optional(),
    fastestLap: z.string().optional(),
    overAchiever: z.string().optional(),
    underAchiever: z.string().optional(),
    wrecker: z.string().optional(),
  }),
  submittedAt: z.string().nullable(),
  submittedBy: z.string().nullable().default(null),
});
export type UserPredictionProps = z.infer<typeof UserPredictionPropsSchema>;

export class UserPrediction {
  private props: UserPredictionProps;
  constructor(props: UserPredictionProps) {
    this.props = UserPredictionPropsSchema.parse(props);
  }
  get userId() { return this.props.userId; }
  get racerIds(): readonly string[] { return this.props.racerIds; }
  get propPicks(): Readonly<Partial<Record<PropName, string>>> { return this.props.propPicks; }
  get submittedAt() { return this.props.submittedAt; }
  get submittedBy() { return this.props.submittedBy; }
}

export class ScoreEntry {
  constructor(
    readonly userId: string,
    readonly gridPoints: number,
    readonly propPoints: number,
    readonly medal: "gold" | "silver" | "bronze" | null,
    readonly weeklyTeamPoints: number = 0,
  ) {}
  get total() { return this.gridPoints + this.propPoints; }
}

const RaceScoresPropsSchema = z.object({
  raceId: z.string().uuid(),
  leagueId: z.string().uuid(),
  raceTitle: z.string(),
  raceDate: z.string(),
  entries: z.array(z.object({
    userId: z.string(),
    gridPoints: z.number().int().min(0),
    propPoints: z.number().int().min(0),
    medal: z.enum(["gold", "silver", "bronze"]).nullable(),
    weeklyTeamPoints: z.number().min(0).default(0),
  })),
});

export class RaceScores {
  readonly raceId: string;
  readonly leagueId: string;
  readonly raceTitle: string;
  readonly raceDate: string;
  readonly entries: readonly ScoreEntry[];

  constructor(props: z.infer<typeof RaceScoresPropsSchema>) {
    const parsed = RaceScoresPropsSchema.parse(props);
    this.raceId = parsed.raceId;
    this.leagueId = parsed.leagueId;
    this.raceTitle = parsed.raceTitle;
    this.raceDate = parsed.raceDate;
    this.entries = parsed.entries.map(e => new ScoreEntry(e.userId, e.gridPoints, e.propPoints, e.medal, e.weeklyTeamPoints));
  }

  entryFor(userId: string): ScoreEntry | undefined {
    return this.entries.find(e => e.userId === userId);
  }
}

export class RacePredictionBook {
  private _raceId: string;
  private _leagueId: string;
  private _predictions: Map<string, UserPrediction>;
  private _scores: RaceScores | null;

  static empty(leagueId: string, raceId: string): RacePredictionBook {
    return new RacePredictionBook(leagueId, raceId, new Map(), null);
  }

  constructor(
    leagueId: string,
    raceId: string,
    predictions: Map<string, UserPrediction>,
    scores: RaceScores | null,
  ) {
    this._leagueId = leagueId;
    this._raceId = raceId;
    this._predictions = predictions;
    this._scores = scores;
  }

  get raceId() { return this._raceId; }
  get leagueId() { return this._leagueId; }
  get scores(): RaceScores | null { return this._scores; }
  get isGraded(): boolean { return this._scores !== null; }

  predictionFor(userId: string): UserPrediction | undefined {
    return this._predictions.get(userId);
  }

  allPredictions(): readonly UserPrediction[] {
    return Array.from(this._predictions.values());
  }

  submitPrediction(userId: string, racerIds: string[], propPicks: Partial<Record<PropName, string>>, submittedAt: string, submittedBy: string | null = null): void {
    this._predictions.set(userId, new UserPrediction({ userId, racerIds, propPicks, submittedAt, submittedBy }));
  }

  grade(league: League, race: Race): RaceScores {
    if (!race.keyOrder || race.keyOrder.length === 0) {
      throw new Error("RacePredictionBook: cannot grade without an answer key");
    }

    const propKey = race.propKey ?? emptyPropKey();

    const rawEntries = Array.from(this._predictions.values()).map(pred => ({
      userId: pred.userId,
      gridPoints: computeGridPoints(
        pred.racerIds as string[],
        race.keyOrder as string[],
        league.placementPoints as number[],
        league.scoringDepth,
      ),
      propPoints: computePropPoints(
        pred.propPicks as Record<string, string>,
        propKey,
        league.propPointValues,
      ),
      weeklyTeamPoints: 0,
    }));

    const graded = assignMedals(rawEntries);
    this._scores = new RaceScores({
      raceId: this._raceId,
      leagueId: this._leagueId,
      raceTitle: race.title,
      raceDate: race.date,
      entries: graded,
    });
    return this._scores;
  }
}

function emptyPropKey(): PropKey {
  return {
    driverOfDay: null, lapsLed: null, fastestPitStop: null,
    fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null,
  };
}
