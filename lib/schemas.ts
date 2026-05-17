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
  teams: z.array(TeamSchema),
});

export type User = z.infer<typeof UserSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Participants = z.infer<typeof ParticipantsSchema>;

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

export const PredictionSchema = z.object({
  seasonId: z.string().uuid(),
  raceId: z.string().uuid(),
  userId: z.string().uuid(),
  racerIds: z.array(z.string().uuid()),
});

export type Prediction = z.infer<typeof PredictionSchema>;

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
