import { connection, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

/** Shallow by default (load balancer). `?deep=1` also checks the database (deploy smoke test). */
export async function GET(request: NextRequest) {
  await connection();
  const body = {
    status: "ok",
    version: process.env.APP_VERSION ?? "dev",
    time: new Date().toISOString(),
  };

  if (request.nextUrl.searchParams.get("deep") !== "1") return Response.json(body);

  try {
    await getDb().$queryRaw`SELECT 1`;
    return Response.json({ ...body, database: "ok" });
  } catch (error) {
    logger.error({ err: error }, "deep health check failed");
    return Response.json({ ...body, status: "degraded", database: "error" }, { status: 503 });
  }
}
