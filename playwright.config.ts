import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm build && HOSTNAME=127.0.0.1 PORT=${port} pnpm start`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          DATABASE_URL:
            process.env.DATABASE_URL ?? "postgresql://hockey:hockey@localhost:5434/hockey_iq",
          SESSION_PASSWORD:
            process.env.SESSION_PASSWORD ?? "e2e-only-session-password-not-a-real-secret",
          COOKIE_SECURE: "false",
          LOG_LEVEL: "warn",
        },
      },
});
