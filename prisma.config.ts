import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "@repo/db/prisma/schema.prisma",
  migrations: {
    path: "@repo/db/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
