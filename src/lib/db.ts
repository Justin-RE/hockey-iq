import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "./database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Lazily creates one PrismaClient per process, so builds don't need a database. */
export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) throw new Error("Database is not configured (DATABASE_URL or DB_*)");
  globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return globalForPrisma.prisma;
}
