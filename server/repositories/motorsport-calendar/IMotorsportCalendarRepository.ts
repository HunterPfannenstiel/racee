import type { MotorsportCalendar } from "@/server/domain/motorsport-calendar";

export interface IMotorsportCalendarRepository {
  /** Empty calendar when the admins haven't set up any seasons yet. */
  findByMotorsport(motorsportId: string): Promise<MotorsportCalendar>;
  save(calendar: MotorsportCalendar): Promise<void>;
}
