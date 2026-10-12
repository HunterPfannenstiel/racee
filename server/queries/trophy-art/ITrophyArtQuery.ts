export type TrophyArtResult = { gold: string | null; silver: string | null; bronze: string | null };

export interface ITrophyArtQuery {
  execute(): Promise<TrophyArtResult>;
}
