import { z } from "zod";

export const TeamPropsSchema = z.object({
  teamId: z.string().uuid(),
  leagueId: z.string().uuid(),
  name: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
  color: z.string().optional(),
});
export type TeamProps = z.infer<typeof TeamPropsSchema>;

export class Team {
  private props: TeamProps;

  constructor(props: TeamProps) {
    this.props = TeamPropsSchema.parse(props);
  }

  get teamId() { return this.props.teamId; }
  get leagueId() { return this.props.leagueId; }
  get name() { return this.props.name; }
  get memberIds(): readonly string[] { return this.props.memberIds; }
  get color() { return this.props.color; }

  rename(name: string): void {
    this.props = TeamPropsSchema.parse({ ...this.props, name });
  }

  updateColor(color: string | undefined): void {
    this.props = { ...this.props, color };
  }

  addMember(userId: string): void {
    if (!this.props.memberIds.includes(userId)) {
      this.props = { ...this.props, memberIds: [...this.props.memberIds, userId] };
    }
  }

  removeMember(userId: string): void {
    this.props = { ...this.props, memberIds: this.props.memberIds.filter(id => id !== userId) };
  }
}
