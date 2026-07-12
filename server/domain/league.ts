import { z } from "zod";

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

export const LeaguePropsSchema = z.object({
  leagueId: z.string().uuid(),
  commissionerId: z.string(),
  coCommissionerIds: z.array(z.string()).optional().default([]),
  memberIds: z.array(z.string()).optional().default([]),
  pendingMemberIds: z.array(z.string()).optional().default([]),
  name: z.string().min(1),
  placementPoints: z.array(z.number().int().min(0)),
  mulliganCount: z.number().int().min(0),
  scoringDepth: z.number().int().min(1).optional(),
  stageCount: z.number().int().min(0).optional(),
  propPointValues: PropPointValuesSchema,
  motorsportId: z.string().uuid(),
  teamPositionPoints: z.array(z.number().min(0)).optional(),
  inviteToken: z.string().nullable().optional().default(null),
});


export type LeagueProps = z.infer<typeof LeaguePropsSchema>;
type LeagueInput = z.input<typeof LeaguePropsSchema>;

export class League {
  private props: LeagueProps;

  constructor(props: LeagueInput) {
    this.props = LeaguePropsSchema.parse(props);
  }

  get leagueId() { return this.props.leagueId; }
  get commissionerId() { return this.props.commissionerId; }
  get coCommissionerIds(): readonly string[] { return this.props.coCommissionerIds; }
  get name() { return this.props.name; }
  get placementPoints(): readonly number[] { return this.props.placementPoints; }
  get mulliganCount() { return this.props.mulliganCount; }
  get scoringDepth() { return this.props.scoringDepth; }  // undefined means score all positions
  get stageCount() { return this.props.stageCount; }
  get propPointValues(): PropPointValues { return this.props.propPointValues; }
  get motorsportId() { return this.props.motorsportId; }
  get memberIds(): readonly string[] { return this.props.memberIds; }
  get pendingMemberIds(): readonly string[] { return this.props.pendingMemberIds; }
  get teamPositionPoints(): readonly number[] | undefined { return this.props.teamPositionPoints; }
  get inviteToken(): string | null { return this.props.inviteToken; }

  generateInviteToken(): string {
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    this.props = { ...this.props, inviteToken: token };
    return token;
  }

  deactivateInviteToken(): void {
    this.props = { ...this.props, inviteToken: null };
  }

  isMember(userId: string): boolean {
    return this.props.memberIds.includes(userId);
  }

  isPending(userId: string): boolean {
    return this.props.pendingMemberIds.includes(userId);
  }

  addMember(userId: string): void {
    if (!this.props.memberIds.includes(userId)) {
      this.props = { ...this.props, memberIds: [...this.props.memberIds, userId] };
    }
  }

  addToPending(userId: string): void {
    if (this.isMember(userId) || this.isPending(userId)) return;
    this.props = { ...this.props, pendingMemberIds: [...this.props.pendingMemberIds, userId] };
  }

  acceptPending(userId: string): void {
    this.props = {
      ...this.props,
      pendingMemberIds: this.props.pendingMemberIds.filter(id => id !== userId),
    };
    this.addMember(userId);
  }

  denyPending(userId: string): void {
    this.props = {
      ...this.props,
      pendingMemberIds: this.props.pendingMemberIds.filter(id => id !== userId),
    };
  }

  removeMember(userId: string): void {
    if (userId === this.props.commissionerId) {
      throw new Error("Cannot remove the commissioner from the league");
    }
    this.props = {
      ...this.props,
      memberIds: this.props.memberIds.filter(id => id !== userId),
      coCommissionerIds: this.props.coCommissionerIds.filter(id => id !== userId),
    };
  }

  rename(name: string): void {
    this.props = LeaguePropsSchema.parse({ ...this.props, name });
  }

  updateScoringConfig(patch: Partial<Omit<LeagueProps, "leagueId" | "name">>): void {
    this.props = LeaguePropsSchema.parse({ ...this.props, ...patch });
  }

  canManage(userId: string): boolean {
    return this.props.commissionerId === userId || this.props.coCommissionerIds.includes(userId);
  }

  promoteToCoCommissioner(userId: string): void {
    if (userId === this.props.commissionerId) {
      throw new Error("Cannot promote the commissioner to co-commissioner");
    }
    this.addMember(userId);
    if (this.props.coCommissionerIds.includes(userId)) return;
    this.props = { ...this.props, coCommissionerIds: [...this.props.coCommissionerIds, userId] };
  }

  demoteCoCommissioner(userId: string): void {
    this.props = { ...this.props, coCommissionerIds: this.props.coCommissionerIds.filter(id => id !== userId) };
  }
}
