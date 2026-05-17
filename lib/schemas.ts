import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

export const TeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  memberIds: z.array(z.string().uuid()),
});

export const ParticipantsSchema = z.object({
  users: z.array(UserSchema),
});

export const SeasonTeamsSchema = z.array(TeamSchema);

export const TeamJoinSchema = z.object({
  seasonId: z.string().uuid(),
  userId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type User = z.infer<typeof UserSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Participants = z.infer<typeof ParticipantsSchema>;
export type TeamJoin = z.infer<typeof TeamJoinSchema>;

export const SeasonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

export const RacerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  team: z.string().min(1),
  image: z.string().url().optional(),
});

export const RaceSchema = z.object({
  id: z.string().uuid(),
  seasonId: z.string().uuid(),
  title: z.string().min(1),
  date: z.string().min(1),
  racerIds: z.array(z.string().uuid()),
});

export type Season = z.infer<typeof SeasonSchema>;
export type Racer = z.infer<typeof RacerSchema>;
export type Race = z.infer<typeof RaceSchema>;

export const RacesFileSchema = z.array(RaceSchema);
export type RacesFile = z.infer<typeof RacesFileSchema>;

export const PredictionsFileSchema = z.object({
  key: z.array(z.string().uuid()).nullable(),
  predictions: z.record(z.string().uuid(), z.array(z.string().uuid())),
});
export type PredictionsFile = z.infer<typeof PredictionsFileSchema>;

export const PredictionMutationSchema = z.object({
  seasonId: z.string().uuid(),
  raceId: z.string().uuid(),
  userId: z.string().uuid(),
  racerIds: z.array(z.string().uuid()),
});
export type PredictionMutation = z.infer<typeof PredictionMutationSchema>;

export const KeyMutationSchema = z.object({
  seasonId: z.string().uuid(),
  raceId: z.string().uuid(),
  racerIds: z.array(z.string().uuid()),
});
export type KeyMutation = z.infer<typeof KeyMutationSchema>;

export const RaceScoreEntrySchema = z.object({
  raceId: z.string().uuid(),
  points: z.number().int().min(0),
});

export const UserSeasonScoresSchema = z.object({
  userId: z.string().uuid(),
  raceScores: z.array(RaceScoreEntrySchema),
});

export const TeamSeasonScoresSchema = z.object({
  teamId: z.string().uuid(),
  raceScores: z.array(RaceScoreEntrySchema),
});

export const SeasonStandingsSchema = z.object({
  seasonId: z.string().uuid(),
  gradedRaceIds: z.array(z.string().uuid()),
  individual: z.array(UserSeasonScoresSchema),
  teams: z.array(TeamSeasonScoresSchema),
});

export type RaceScoreEntry = z.infer<typeof RaceScoreEntrySchema>;
export type UserSeasonScores = z.infer<typeof UserSeasonScoresSchema>;
export type TeamSeasonScores = z.infer<typeof TeamSeasonScoresSchema>;
export type SeasonStandings = z.infer<typeof SeasonStandingsSchema>;

export const ScoreEntrySchema = z.object({
  userId: z.string().uuid(),
  gridPoints: z.number().int().min(0),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
});

export const RaceScoresSchema = z.object({
  raceId: z.string().uuid(),
  seasonId: z.string().uuid(),
  raceTitle: z.string(),
  raceDate: z.string(),
  entries: z.array(ScoreEntrySchema),
});

export type ScoreEntry = z.infer<typeof ScoreEntrySchema>;
export type RaceScores = z.infer<typeof RaceScoresSchema>;
