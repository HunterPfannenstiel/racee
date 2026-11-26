import { z } from "zod";
import { QuestionKindSchema } from "./season-props";

/**
 * The admins' library of year-long questions for one motorsport. Leagues pick
 * from it when they set up season bets, and the admins enter each question's
 * correct answer once, at the end of the season, so every league using it is
 * graded automatically.
 */
export const LibraryQuestionSchema = z.object({
  questionId: z.string().uuid(),
  /** The admin season this question is for (null = any season). */
  motorsportSeasonId: z.string().uuid().nullable().default(null),
  prompt: z.string().trim().min(1).max(200),
  kind: QuestionKindSchema,
  options: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  /** The correct answer(s); several when there's a tie. Empty = not answered yet. */
  answers: z.array(z.string()).default([]),
  /** Thrown out: nobody scores it. */
  voided: z.boolean().default(false),
  /** "running" = the answer so far (counts now, changes as the season goes); "final" = settled. */
  answerStatus: z.enum(["running", "final"]).default("final"),
  /** When the answer last changed (set by the server). */
  answerUpdatedAt: z.string().nullable().default(null),
});
export type LibraryQuestion = z.infer<typeof LibraryQuestionSchema>;

export class SeasonQuestionLibrary {
  private _questions: LibraryQuestion[];

  static empty(motorsportId: string): SeasonQuestionLibrary {
    return new SeasonQuestionLibrary(motorsportId, []);
  }

  constructor(readonly motorsportId: string, questions: z.input<typeof LibraryQuestionSchema>[]) {
    this._questions = questions.map(q => LibraryQuestionSchema.parse(q));
  }

  get questions(): readonly LibraryQuestion[] { return this._questions; }

  find(questionId: string): LibraryQuestion | undefined {
    return this._questions.find(q => q.questionId === questionId);
  }

  /** Replaces the whole list (the admin page edits it as one). */
  replaceAll(questions: z.input<typeof LibraryQuestionSchema>[]): void {
    const now = new Date().toISOString();
    const parsed = questions.map(q => {
      const next = LibraryQuestionSchema.parse(q);
      const prev = this.find(next.questionId);
      const changed = !prev || prev.answers.join("\u0000") !== next.answers.join("\u0000") || prev.answerStatus !== next.answerStatus;
      return { ...next, answerUpdatedAt: changed ? (next.answers.length > 0 ? now : null) : (prev?.answerUpdatedAt ?? null) };
    });
    if (new Set(parsed.map(q => q.questionId)).size !== parsed.length) throw new Error("Two questions share an id");
    this._questions = parsed;
  }
}
