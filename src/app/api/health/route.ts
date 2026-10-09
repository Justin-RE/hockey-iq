import { connection } from "next/server";

export async function GET() {
  await connection();
  return Response.json({
    status: "ok",
    version: process.env.APP_VERSION ?? "dev",
    time: new Date().toISOString(),
  });
}
