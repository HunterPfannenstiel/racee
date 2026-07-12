import { z } from "zod";
import { authed } from "@/server/rpc/procedures";
import { MotorsportSchema } from "@/lib/schemas";
import { BlobMotorsportRepository } from "@/server/repositories/motorsport/BlobMotorsportRepository";
import { BlobMotorsportsQuery } from "@/server/queries/motorsports/BlobMotorsportsQuery";

const motorsportRepo = new BlobMotorsportRepository();

const motorsportsQuery = new BlobMotorsportsQuery(motorsportRepo);

export const motorsportsRouter = {
  /** All motorsports. Ported read-only from app/api/motorsports/route.ts. */
  list: authed
    .output(z.array(MotorsportSchema))
    .handler(async () => motorsportsQuery.execute()),
};
