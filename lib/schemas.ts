import { z } from "zod";
import { TeamPropsSchema } from "@/server/domain/team";
import { LeaguePropsSchema, PropPointValuesSchema } from "@/server/domain/league";
import { RacerPropsSchema } from "@/server/domain/racer";
import { RacePropsSchema } from "@/server/domain/race";
import { MotorsportPropsSchema } from "@/server/domain/motorsport";
import { UserRaceScoreSchema } from "@/server/domain/league-standings";
import {
  PropNameSchema,
  PropKeySchema,
  PropPicksSchema,
  ScoreEntryPropsSchema,
  RaceScoresPropsSchema,
} from "@/server/domain/race-prediction-book";

// NOTE: server/domain/user.ts's User is a plain Prisma-managed interface ({ userId, name, isAdmin }),
// not a zod schema — nothing to derive from. This DTO also intentionally strips isAdmin and renames
// userId -> id, so it stays hand-written.
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
});

// Derived from TeamPropsSchema. id is a rename of the domain's teamId, and leagueId is intentionally
// dropped (teams are already scoped by league wherever this DTO is used) — both kept hand-written.
export const TeamSchema = TeamPropsSchema.pick({
  name: true,
  memberIds: true,
  color: true,
}).extend({
  id: z.string().uuid(),
});

export const ParticipantsSchema = z.object({
  users: z.array(UserSchema),
});

export const LeagueTeamsSchema = z.array(TeamSchema);

export const TeamJoinSchema = z.object({
  leagueId: z.string().uuid(),
  userId: z.string(),
  teamId: z.string().uuid(),
});

export type User = z.infer<typeof UserSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Participants = z.infer<typeof ParticipantsSchema>;
export type TeamJoin = z.infer<typeof TeamJoinSchema>;

export const PlacementPointsSchema = LeaguePropsSchema.shape.placementPoints;
export type PlacementPoints = z.infer<typeof PlacementPointsSchema>;

export { PropNameSchema };
export type PropName = z.infer<typeof PropNameSchema>;

export { PropPointValuesSchema };
export type PropPointValues = z.infer<typeof PropPointValuesSchema>;

// Derived from LeaguePropsSchema. id is a rename of the domain's leagueId. commissionerId,
// coCommissionerIds, memberIds, pendingMemberIds and inviteToken are internal membership/invite
// state that this DTO intentionally never exposes to clients — kept out rather than picked.
export const LeagueSchema = LeaguePropsSchema.pick({
  name: true,
  placementPoints: true,
  mulliganCount: true,
  scoringDepth: true,
  stageCount: true,
  propPointValues: true,
  motorsportId: true,
  teamPositionPoints: true,
}).extend({
  id: z.string().uuid(),
});

// Derived field-by-field from RacerPropsSchema (via .shape, not .pick/.omit — the domain field is
// literally named "constructor", which collides with TS's implicit Object.prototype.constructor and
// breaks pick/omit's Mask typing). id is a rename of the domain's racerId. "team" is a rename of the
// domain's "constructor" field — racer.ts deliberately calls it constructor to avoid confusion with
// the Team aggregate; this DTO predates that distinction and keeps its own name, so it stays hand-written.
export const RacerSchema = z.object({
  id: z.string().uuid(),
  name: RacerPropsSchema.shape.name,
  team: z.string().min(1),
  motorsportId: RacerPropsSchema.shape.motorsportId,
  image: RacerPropsSchema.shape.image,
  teamColor: RacerPropsSchema.shape.teamColor,
});

export { PropKeySchema };
export type PropKey = z.infer<typeof PropKeySchema>;

// Derived from RacePropsSchema. id is a rename of the domain's raceId. keyOrder/propKey/keySetAt are
// kept hand-written: the domain defaults them to null (always present after parse), while this DTO
// makes them optional-or-null to support partial/pre-key API payloads.
export const RaceSchema = RacePropsSchema.pick({
  motorsportId: true,
  title: true,
  label: true,
  date: true,
  lockTime: true,
  startingGrid: true,
}).extend({
  id: z.string().uuid(),
  keyOrder: z.array(z.string().uuid()).nullable().optional(),
  propKey: PropKeySchema.nullable().optional(),
  keySetAt: z.string().nullable().optional(),
});

// Derived from MotorsportPropsSchema. id is a rename of the domain's motorsportId.
export const MotorsportSchema = MotorsportPropsSchema.omit({
  motorsportId: true,
}).extend({
  id: z.string().uuid(),
});

export type League = z.infer<typeof LeagueSchema>;
export type Racer = z.infer<typeof RacerSchema>;
export type Race = z.infer<typeof RaceSchema>;
export type Motorsport = z.infer<typeof MotorsportSchema>;

export const RacesFileSchema = z.array(RaceSchema);
export type RacesFile = z.infer<typeof RacesFileSchema>;

export const PredictionsFileSchema = z.object({
  key: z.array(z.string().uuid()).nullable(),
  keySetAt: z.string().nullable().default(null),
  predictions: z.record(z.string(), z.array(z.string().uuid())),
  submittedAt: z.record(z.string(), z.string()).optional(),
  propKey: PropKeySchema,
  propPicks: z.record(z.string(), PropPicksSchema),
});
export type PredictionsFile = z.infer<typeof PredictionsFileSchema>;

export const PredictionMutationSchema = z.object({
  leagueId: z.string().uuid(),
  raceId: z.string().uuid(),
  userId: z.string(),
  racerIds: z.array(z.string().uuid()),
  propPicks: z.record(PropNameSchema, z.string()).optional(),
});
export type PredictionMutation = z.infer<typeof PredictionMutationSchema>;

export const CommissionerPredictionMutationSchema = z.object({
  raceId: z.string().uuid(),
  racerIds: z.array(z.string().uuid()),
  propPicks: z.record(PropNameSchema, z.string()).optional(),
});
export type CommissionerPredictionMutation = z.infer<typeof CommissionerPredictionMutationSchema>;

export const KeyMutationSchema = z.object({
  motorsportId: z.string().uuid(),
  raceId: z.string().uuid(),
  racerIds: z.array(z.string().uuid()),
  propKey: PropKeySchema,
});
export type KeyMutation = z.infer<typeof KeyMutationSchema>;

// Re-exported directly from league-standings.ts — identical shape, just a different export name.
export const RaceScoreEntrySchema = UserRaceScoreSchema;
export type RaceScoreEntry = z.infer<typeof RaceScoreEntrySchema>;

// server/domain/league-standings.ts's UserLeagueScores is a class with no zod props schema of its
// own (constructor takes primitives directly), so the object shape stays hand-written; the nested
// raceScores entry type is still derived from the domain's UserRaceScoreSchema.
export const UserLeagueScoresSchema = z.object({
  userId: z.string(),
  raceScores: z.array(RaceScoreEntrySchema),
});
export type UserLeagueScores = z.infer<typeof UserLeagueScoresSchema>;

// Same rationale as UserLeagueScoresSchema — TeamLeagueScores is a class, no props schema to derive from.
export const TeamLeagueScoresSchema = z.object({
  teamId: z.string().uuid(),
  raceScores: z.array(RaceScoreEntrySchema),
});
export type TeamLeagueScores = z.infer<typeof TeamLeagueScoresSchema>;

// LeagueStandings is likewise a class with no props schema; shape hand-written, nested schemas derived.
export const LeagueStandingsSchema = z.object({
  leagueId: z.string().uuid(),
  gradedRaceIds: z.array(z.string().uuid()),
  individual: z.array(UserLeagueScoresSchema),
  teams: z.array(TeamLeagueScoresSchema),
});
export type LeagueStandings = z.infer<typeof LeagueStandingsSchema>;

// Re-exported directly from race-prediction-book.ts.
export const ScoreEntrySchema = ScoreEntryPropsSchema;
export type ScoreEntry = z.infer<typeof ScoreEntrySchema>;

// Re-exported directly from race-prediction-book.ts.
export const RaceScoresSchema = RaceScoresPropsSchema;
export type RaceScores = z.infer<typeof RaceScoresSchema>;
