# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/tsconfig/ ./packages/tsconfig/
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/api/ ./apps/api/

# Build shared-types
RUN pnpm --filter @dividdy/shared-types build

# Generate Prisma client
RUN pnpm --filter @dividdy/api db:generate

# Build API
RUN pnpm --filter @dividdy/api build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 dividdy

# Copy built files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.prisma

# Install production dependencies only
RUN pnpm install --prod --ignore-scripts

# Create uploads directory
RUN mkdir -p /app/uploads && chown dividdy:nodejs /app/uploads

# Switch to non-root user
USER dividdy

EXPOSE 4000

# Run migrations and start server
CMD npx prisma migrate deploy && node dist/index.js

