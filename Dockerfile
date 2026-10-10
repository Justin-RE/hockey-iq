# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache openssl && npm install -g pnpm@10.33.0
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies (also runs `prisma generate` via postinstall).
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY infra/package.json ./infra/package.json
COPY prisma ./prisma
COPY src/lib/database-url.ts ./src/lib/database-url.ts
RUN pnpm install --frozen-lockfile --filter hockey-iq

FROM base AS build
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time.
ARG APP_VERSION=dev
ARG NEXT_PUBLIC_SENTRY_DSN=""
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .
RUN pnpm build

# Standalone Prisma CLI for the one-off migration task (same image, different command).
FROM base AS migrate
WORKDIR /migrate
COPY docker/migrate/package.json ./
RUN npm install --omit=dev --no-package-lock --no-audit --no-fund
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src/lib/database-url.ts ./src/lib/database-url.ts

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl && addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Amazon RDS CA bundle so node-postgres can verify the database certificate (sslmode=verify-full).
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/rds-global-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-global-bundle.pem
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=migrate --chown=app:app /migrate ./migrate

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
