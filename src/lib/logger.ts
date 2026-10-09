import "server-only";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "hockey-iq", env: process.env.APP_ENV ?? "local" },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
  redact: {
    paths: ["password", "*.password", "passwordHash", "*.passwordHash", "cookie", "*.cookie"],
    censor: "[redacted]",
  },
});
