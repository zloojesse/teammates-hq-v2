# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# pnpm v11 strict-ignored-builds: install with --ignore-scripts, then explicit rebuild
# to run postinstalls for esbuild/sharp/unrs-resolver (native binaries).
RUN pnpm install --frozen-lockfile --ignore-scripts \
 && pnpm rebuild

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "echo '[boot] migrate…'; pnpm db:migrate 2>&1 || echo '[boot] migrate FAILED (continuing)'; echo '[boot] seed…'; pnpm db:seed 2>&1 || echo '[boot] seed FAILED (continuing)'; echo '[boot] next start…'; exec node node_modules/next/dist/bin/next start -p ${PORT:-3000} -H 0.0.0.0"]
