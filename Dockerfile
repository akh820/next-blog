
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
 
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

# Build-time arguments
ARG NOTION_TOKEN
ARG NOTION_DATABASE_ID
ARG DEEPL_API_KEY
ARG NEXT_PUBLIC_SITE_URL

# Set as environment variables for build
ENV NOTION_TOKEN=${NOTION_TOKEN}
ENV NOTION_DATABASE_ID=${NOTION_DATABASE_ID}
ENV DEEPL_API_KEY=${DEEPL_API_KEY}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]