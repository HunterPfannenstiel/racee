import { z } from "zod";

export const MotorsportPropsSchema = z.object({
  motorsportId: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
});
export type MotorsportProps = z.infer<typeof MotorsportPropsSchema>;

export class Motorsport {
  private props: MotorsportProps;

  constructor(props: MotorsportProps) {
    this.props = MotorsportPropsSchema.parse(props);
  }

  get motorsportId() { return this.props.motorsportId; }
  get name() { return this.props.name; }
  get slug() { return this.props.slug; }

  rename(name: string): void {
    this.props = MotorsportPropsSchema.parse({ ...this.props, name });
  }

  updateSlug(slug: string): void {
    this.props = MotorsportPropsSchema.parse({ ...this.props, slug });
  }
}
