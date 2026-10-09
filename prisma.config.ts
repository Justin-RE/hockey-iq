import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDatabaseUrl } from "./src/lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` does not connect, so a placeholder keeps it working without a database.
    url: resolveDatabaseUrl() ?? "postgresql://placeholder@localhost:5432/placeholder",
  },
});
