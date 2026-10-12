import { z } from "zod";

export const TeamPropsSchema = z.object({
  teamId: z.string().uuid(),
  leagueId: z.string().uuid(),
  name: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
  color: z.string().optional(),
  /** Uploaded team logo, "upload:<version>" — see lib/avatar.ts teamLogoSrc. */
  logo: z.string().nullable().default(null),
  /** Who uploaded the current logo (gets the strike if an admin removes it). */
  logoUploadedBy: z.string().nullable().default(null),
});
export type TeamProps = z.infer<typeof TeamPropsSchema>;

export class Team {
  private props: TeamProps;

  constructor(props: z.input<typeof TeamPropsSchema>) {
    this.props = TeamPropsSchema.parse(props);
  }

  get teamId() { return this.props.teamId; }
  get leagueId() { return this.props.leagueId; }
  get name() { return this.props.name; }
  get memberIds(): readonly string[] { return this.props.memberIds; }
  get color() { return this.props.color; }
  get logo(): string | null { return this.props.logo; }
  get logoUploadedBy(): string | null { return this.props.logoUploadedBy; }

  rename(name: string): void {
    this.props = TeamPropsSchema.parse({ ...this.props, name });
  }

  setLogo(logo: string | null, uploadedBy: string | null = null): void {
    this.props = { ...this.props, logo, logoUploadedBy: logo ? uploadedBy : null };
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
