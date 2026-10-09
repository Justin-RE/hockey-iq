type Env = Record<string, string | undefined>;

/**
 * Resolves the Postgres connection string.
 * Locally DATABASE_URL is set directly. On ECS the RDS secret is injected as
 * separate DB_* variables, so the URL is assembled here.
 */
export function resolveDatabaseUrl(env: Env = process.env): string | undefined {
  if (env.DATABASE_URL) return env.DATABASE_URL;

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) return undefined;

  const user = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD);
  const ssl = env.DB_SSL === "false" ? "" : "?sslmode=require";
  return `postgresql://${user}:${password}@${DB_HOST}:${DB_PORT ?? "5432"}/${DB_NAME}${ssl}`;
}
