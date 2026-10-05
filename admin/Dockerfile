# =====================================================================
# Admin Dashboard Production Multi-Stage Dockerfile
# Build context: repository root (docker build -f admin/Dockerfile -t erp-admin .)
# =====================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY admin/package.json ./admin/

# Install workspace dependencies
RUN npm ci

# Copy shared library and admin source
COPY shared ./shared
COPY admin ./admin

# Build shared package
RUN npm run build --workspace=@erp/shared

# Build Next.js production bundle
WORKDIR /app/admin
ENV NODE_ENV=production
RUN npm run build

# =====================================================================
# Production Runtime Stage
# =====================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY admin/package.json ./admin/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled shared package and Next.js build
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/admin/.next ./admin/.next
COPY --from=builder /app/admin/next.config.mjs ./admin/next.config.mjs

RUN mkdir -p /app/admin/public && chown -R node:node /app

USER node
EXPOSE 3000

WORKDIR /app/admin
CMD ["npx", "next", "start", "-p", "3000"]
