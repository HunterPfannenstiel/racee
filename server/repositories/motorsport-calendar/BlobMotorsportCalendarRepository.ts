import { z } from "zod";
import { blob } from "@/lib/blob";
import { motorsportSeasonsPath } from "@/lib/paths";
import { MotorsportCalendar, MotorsportSeasonSchema } from "@/server/domain/motorsport-calendar";
import { ParseError, PersistenceError } from "@/server/repositories/errors";
import type { IMotorsportCalendarRepository } from "./IMotorsportCalendarRepository";

const CalendarPersistenceSchema = z.object({
  motorsportId: z.string(),
  seasons: z.array(MotorsportSeasonSchema),
});

export class BlobMotorsportCalendarRepository implements IMotorsportCalendarRepository {
  async findByMotorsport(motorsportId: string): Promise<MotorsportCalendar> {
    const path = motorsportSeasonsPath(motorsportId);
    let raw: unknown;
    try {
      raw = await blob.read<unknown>(path);
    } catch (e) {
      throw new PersistenceError("read", path, e);
    }
    if (raw === null) return MotorsportCalendar.empty(motorsportId);
    try {
      return new MotorsportCalendar(motorsportId, CalendarPersistenceSchema.parse(raw).seasons);
    } catch (e) {
      throw new ParseError(path, e);
    }
  }

  async save(calendar: MotorsportCalendar): Promise<void> {
    const path = motorsportSeasonsPath(calendar.motorsportId);
    try {
      await blob.write(path, { motorsportId: calendar.motorsportId, seasons: calendar.seasons });
    } catch (e) {
      throw new PersistenceError("write", path, e);
    }
  }
}
