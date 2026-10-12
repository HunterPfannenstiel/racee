import { z } from "zod";

/**
 * What a player keeps off their public trophy shelf. Hidden leagues and
 * trophies still show to the player themselves, and to members of that league
 * when they view the player from inside it.
 */
export const ProfilePrivacyPropsSchema = z.object({
  userId: z.string(),
  hiddenLeagueIds: z.array(z.string()).default([]),
  /** Trophy keys: `${leagueId}:${seasonId}`. */
  hiddenTrophyKeys: z.array(z.string()).default([]),
});
export type ProfilePrivacyProps = z.infer<typeof ProfilePrivacyPropsSchema>;

export const trophyKey = (leagueId: string, seasonId: string) => `${leagueId}:${seasonId}`;

export class ProfilePrivacy {
  private props: ProfilePrivacyProps;

  static empty(userId: string): ProfilePrivacy {
    return new ProfilePrivacy({ userId });
  }

  constructor(props: z.input<typeof ProfilePrivacyPropsSchema>) {
    this.props = ProfilePrivacyPropsSchema.parse(props);
  }

  get userId() { return this.props.userId; }
  get hiddenLeagueIds(): readonly string[] { return this.props.hiddenLeagueIds; }
  get hiddenTrophyKeys(): readonly string[] { return this.props.hiddenTrophyKeys; }

  isLeagueHidden(leagueId: string): boolean { return this.props.hiddenLeagueIds.includes(leagueId); }
  isTrophyHidden(key: string): boolean { return this.props.hiddenTrophyKeys.includes(key); }

  setLeagueHidden(leagueId: string, hidden: boolean): void {
    const rest = this.props.hiddenLeagueIds.filter(id => id !== leagueId);
    this.props = { ...this.props, hiddenLeagueIds: hidden ? [...rest, leagueId] : rest };
  }

  setTrophyHidden(key: string, hidden: boolean): void {
    const rest = this.props.hiddenTrophyKeys.filter(k => k !== key);
    this.props = { ...this.props, hiddenTrophyKeys: hidden ? [...rest, key] : rest };
  }
}
