import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

export const TeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  memberIds: z.array(z.string().uuid()),
  color: z.string().optional(),
});

export const ParticipantsSchema = z.object({
  users: z.array(UserSchema),
});

export const LeagueTeamsSchema = z.array(TeamSchema);

export const TeamJoinSchema = z.object({
  leagueId: z.string().uuid(),
  userId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type User = z.infer<typeof UserSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Participants = z.infer<typeof ParticipantsSchema>;
export type TeamJoin = z.infer<typeof TeamJoinSchema>;

export const PlacementPointsSchema = z.array(z.number().int().min(0));
export type PlacementPoints = z.infer<typeof PlacementPointsSchema>;

export const PropNameSchema = z.enum([
  "driverOfDay",
  "lapsLed",
  "fastestPitStop",
  "fastestLap",
  "overAchiever",
  "underAchiever",
  "wrecker",
]);
export type PropName = z.infer<typeof PropNameSchema>;

export const PropPointValuesSchema = z.object({
  driverOfDay: z.number().int().min(0),
  lapsLed: z.number().int().min(0),
  fastestPitStop: z.number().int().min(0),
  fastestLap: z.number().int().min(0),
  overAchiever: z.number().int().min(0),
  underAchiever: z.number().int().min(0),
  wrecker: z.number().int().min(0),
});
export type PropPointValues = z.infer<typeof PropPointValuesSchema>;

export const LeagueSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  placementPoints: PlacementPointsSchema,
  mulliganCount: z.number().int().min(0),
  propPointValues: PropPointValuesSchema,
});

export const RacerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  team: z.string().min(1),
  image: z.string().url().optional(),
  teamColor: z.string().optional(),
});

export const RaceSchema = z.object({
  id: z.string().uuid(),
  leagueId: z.string().uuid(),
  title: z.string().min(1),
  date: z.string().min(1),
  racerIds: z.array(z.string().uuid()),
});

export type League = z.infer<typeof LeagueSchema>;
export type Racer = z.infer<typeof RacerSchema>;
export type Race = z.infer<typeof RaceSchema>;

export const RacesFileSchema = z.array(RaceSchema);
export type RacesFile = z.infer<typeof RacesFileSchema>;

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

export const PredictionsFileSchema = z.object({
  key: z.array(z.string().uuid()).nullable(),
  keySetAt: z.string().nullable().default(null),
  predictions: z.record(z.string().uuid(), z.array(z.string().uuid())),
  submittedAt: z.record(z.string().uuid(), z.string()).optional(),
  propKey: PropKeySchema,
  propPicks: z.record(z.string().uuid(), z.object({
    driverOfDay: z.string().optional(),
    lapsLed: z.string().optional(),
    fastestPitStop: z.string().optional(),
    fastestLap: z.string().optional(),
    overAchiever: z.string().optional(),
    underAchiever: z.string().optional(),
    wrecker: z.string().optional(),
  })),
});
export type PredictionsFile = z.infer<typeof PredictionsFileSchema>;

export const PredictionMutationSchema = z.object({
  leagueId: z.string().uuid(),
  raceId: z.string().uuid(),
  userId: z.string().uuid(),
  racerIds: z.array(z.string().uuid()),
  propPicks: z.record(PropNameSchema, z.string()).optional(),
});
export type PredictionMutation = z.infer<typeof PredictionMutationSchema>;

export const KeyMutationSchema = z.object({
  leagueId: z.string().uuid(),
  raceId: z.string().uuid(),
  racerIds: z.array(z.string().uuid()),
  propKey: PropKeySchema,
});
export type KeyMutation = z.infer<typeof KeyMutationSchema>;

export const RaceScoreEntrySchema = z.object({
  raceId: z.string().uuid(),
  points: z.number().int().min(0),
});

export const UserLeagueScoresSchema = z.object({
  userId: z.string().uuid(),
  raceScores: z.array(RaceScoreEntrySchema),
});

export const TeamLeagueScoresSchema = z.object({
  teamId: z.string().uuid(),
  raceScores: z.array(RaceScoreEntrySchema),
});

export const LeagueStandingsSchema = z.object({
  leagueId: z.string().uuid(),
  gradedRaceIds: z.array(z.string().uuid()),
  individual: z.array(UserLeagueScoresSchema),
  teams: z.array(TeamLeagueScoresSchema),
});

export type RaceScoreEntry = z.infer<typeof RaceScoreEntrySchema>;
export type UserLeagueScores = z.infer<typeof UserLeagueScoresSchema>;
export type TeamLeagueScores = z.infer<typeof TeamLeagueScoresSchema>;
export type LeagueStandings = z.infer<typeof LeagueStandingsSchema>;

export const ScoreEntrySchema = z.object({
  userId: z.string().uuid(),
  gridPoints: z.number().int().min(0),
  propPoints: z.number().int().min(0),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
});

export const RaceScoresSchema = z.object({
  raceId: z.string().uuid(),
  leagueId: z.string().uuid(),
  raceTitle: z.string(),
  raceDate: z.string(),
  entries: z.array(ScoreEntrySchema),
});

export type ScoreEntry = z.infer<typeof ScoreEntrySchema>;
export type RaceScores = z.infer<typeof RaceScoresSchema>;
