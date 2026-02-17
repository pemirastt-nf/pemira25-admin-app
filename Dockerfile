# Base Image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
# Install pnpm if needed, or use npm
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure the cache directory exists and is writable
RUN mkdir -p .next/cache/images
RUN chown -R nextjs:nodejs .next/cache

USER nextjs

EXPOSE 3333

ENV PORT 3333
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
