# =====================================================================
# API (Backend) Production Multi-Stage Dockerfile
# Build context: repository root (docker build -f api/Dockerfile -t erp-api .)
# =====================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma engines on Alpine
RUN apk add --no-cache openssl

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY api/package.json ./api/

# Install all workspace dependencies
RUN npm ci

# Copy shared types and API source
COPY shared ./shared
COPY api ./api

# Build shared package
RUN npm run build --workspace=@erp/shared

# Generate Prisma Client and compile API TypeScript to dist/
WORKDIR /app/api
RUN npx prisma generate
RUN npm run build

# =====================================================================
# Production Runtime Stage
# =====================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache openssl

# Copy root & workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY api/package.json ./api/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled artifacts & generated prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/api/node_modules/.prisma ./api/node_modules/.prisma
COPY --from=builder /app/api/prisma ./api/prisma
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/api/dist ./api/dist

# Create uploads directory and set unprivileged permissions
RUN mkdir -p /app/api/uploads && chown -R node:node /app

USER node
EXPOSE 4000

WORKDIR /app/api
CMD ["node", "dist/index.js"]
