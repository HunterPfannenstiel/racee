import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { defineConfig } from "prisma/config";
import { withSchema } from "./server/db-url.ts";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: withSchema(process.env["DIRECT_URL"]!, process.env["DATABASE_SCHEMA"]),
  },
});
