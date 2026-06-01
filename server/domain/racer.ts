import { z } from "zod";

const RacerPropsSchema = z.object({
  racerId: z.string().uuid(),
  name: z.string().min(1),
  constructor: z.string().min(1),   // F1 constructor name (e.g. "Red Bull") — NOT the Team aggregate
  image: z.string().url().optional(),
  teamColor: z.string().optional(),
});
type RacerProps = z.infer<typeof RacerPropsSchema>;

export class Racer {
  private props: RacerProps;

  constructor(props: RacerProps) {
    this.props = RacerPropsSchema.parse(props);
  }

  get racerId() { return this.props.racerId; }
  get name() { return this.props.name; }
  get constructorName() { return this.props.constructor; }
  get image() { return this.props.image; }
  get teamColor() { return this.props.teamColor; }

  updateProfile(patch: Partial<Omit<RacerProps, "racerId">>): void {
    this.props = RacerPropsSchema.parse({ ...this.props, ...patch });
  }
}
