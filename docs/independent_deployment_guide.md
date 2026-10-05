# Independent Environment Configuration & Multi-Service Deployment Guide

This guide details the architecture, configuration isolation, build steps, and production deployment instructions for the three decoupled services in the repository:

- **`api`** — Backend API & Real-time engine (`https://api.example.com`)
- **`app`** — User/Salesperson Mobile & Web Frontend (`https://example.com`)
- **`admin`** — Administrative Web Dashboard (`https://admin.example.com`)

---

## 1. Summary of Changes & Architecture Rationale

| File Path | Nature | Rationale |
|:---|:---|:---|
| [.gitignore](file:///Users/grahithrao/salesperson_tracking_erp/.gitignore) | Modified | Enforces strict exclusion of real `.env`, `.env.*`, and `.env.local` across all service folders while explicitly permitting all `.env.example` templates (`!**/.env.example`). |
| [api/.env.example](file:///Users/grahithrao/salesperson_tracking_erp/api/.env.example) | Created | Documents required backend private variables: database URL, JWT secret, port, CORS allowed origins, upload directory, and default timezone. |
| [admin/.env.example](file:///Users/grahithrao/salesperson_tracking_erp/admin/.env.example) | Created | Documents public Next.js variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`) and server-side rewrite variable (`API_URL`). |
| [app/.env.example](file:///Users/grahithrao/salesperson_tracking_erp/app/.env.example) | Created | Documents public Expo variables (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_DEFAULT_TIMEZONE`). |
| [api/src/config.ts](file:///Users/grahithrao/salesperson_tracking_erp/api/src/config.ts) | Modified | Isolates dotenv loading strictly to `api/.env` (eliminating accidental fallback to parent monorepo secrets). Implements secret-safe `validateConfig()` to reject missing or insecure variables without leaking passwords. Parses `corsOrigins`. |
| [api/src/index.ts](file:///Users/grahithrao/salesperson_tracking_erp/api/src/index.ts) | Modified | Validates environment immediately at startup. Replaces wildcard `origin: true` with strict CORS origin validation against configured allowed frontend domains. |
| [api/src/socket/index.ts](file:///Users/grahithrao/salesperson_tracking_erp/api/src/socket/index.ts) | Modified | Enforces explicit CORS allowed origins on Socket.IO connections. |
| [api/src/middleware/auth.ts](file:///Users/grahithrao/salesperson_tracking_erp/api/src/middleware/auth.ts) | Modified | Preserves JWT Bearer authentication while adding query-parameter token fallback (`?token=...`) for PDF receipt downloads opened in new browser tabs. |
| [admin/src/config/api.ts](file:///Users/grahithrao/salesperson_tracking_erp/admin/src/config/api.ts) | Created | Centralizes API base URL and Socket.IO URL resolution, sanitizes trailing slashes, and provides `getApiUrl()` helper. |
| [admin/next.config.mjs](file:///Users/grahithrao/salesperson_tracking_erp/admin/next.config.mjs) | Modified | Replaces hardcoded `http://localhost:4000` rewrite with dynamic `process.env.API_URL || process.env.NEXT_PUBLIC_API_URL`. |
| [admin/src/context/SocketContext.tsx](file:///Users/grahithrao/salesperson_tracking_erp/admin/src/context/SocketContext.tsx) | Modified | Connects Socket.IO directly to centralized `SOCKET_URL`. |
| [admin/src/app/payments/page.tsx](file:///Users/grahithrao/salesperson_tracking_erp/admin/src/app/payments/page.tsx) | Modified | Uses `getApiUrl()` for receipt PDF download links. |
| [app/src/config.ts](file:///Users/grahithrao/salesperson_tracking_erp/app/src/config.ts) | Modified | Normalizes and sanitizes `EXPO_PUBLIC_API_URL` (stripping trailing slashes). Emits clear warnings if a web production deployment mistakenly references localhost. |
| [app/package.json](file:///Users/grahithrao/salesperson_tracking_erp/app/package.json) | Modified | Added `"build": "expo export -p web"` for standard production builds. |
| [package.json](file:///Users/grahithrao/salesperson_tracking_erp/package.json) | Modified | Added `"build:shared": "npm --workspace=@erp/shared run build"` for CI/CD pipelines and deployment container contexts. |
| [api/Dockerfile](file:///Users/grahithrao/salesperson_tracking_erp/api/Dockerfile) & `.dockerignore` | Created | Production multi-stage container build for the API backend. |
| [admin/Dockerfile](file:///Users/grahithrao/salesperson_tracking_erp/admin/Dockerfile) & `.dockerignore` | Created | Production multi-stage container build for the Next.js admin dashboard. |
| [admin/vercel.json](file:///Users/grahithrao/salesperson_tracking_erp/admin/vercel.json) | Created | Vercel deployment project settings for `admin`. |
| [app/vercel.json](file:///Users/grahithrao/salesperson_tracking_erp/app/vercel.json) | Created | Vercel static SPA deployment settings for `app`. |
| [render.yaml](file:///Users/grahithrao/salesperson_tracking_erp/render.yaml) | Created | Infrastructure as Code Blueprint configuring all 3 independent services on Render. |
| [ecosystem.config.js](file:///Users/grahithrao/salesperson_tracking_erp/ecosystem.config.js) | Created | PM2 cluster configuration for self-hosted VPS / dedicated server deployments. |
| [api/test_deployment_env.ts](file:///Users/grahithrao/salesperson_tracking_erp/api/test_deployment_env.ts) | Created | Automated verification suite validating configuration failure modes, credential safety, CORS enforcement, cross-origin token handling, and server-side RBAC boundaries. |

---

## 2. Environment Variable Matrix

### 2.1 Backend API (`api`)
> **Security Rule**: Stored strictly in `api/.env` locally or injected into the container/runtime by the hosting platform. **NEVER** expose to the client browser or commit to git.

| Variable Name | Visibility | Required in Production | Default / Local Dev Value | Purpose |
|:---|:---:|:---:|:---|:---|
| `DATABASE_URL` | **Private** | **YES** | `postgresql://...` | Connection string to PostgreSQL database. |
| `JWT_SECRET` | **Private** | **YES** (min 32 chars) | Dev fallback key | Secret key used to sign and verify HMAC-SHA256 JWT tokens. |
| `JWT_EXPIRES_IN` | **Private** | No | `7d` | Token expiration lifespan (e.g. `7d`, `24h`). |
| `PORT` | **Private** | No | `4000` | Port on which the Express HTTP & WebSocket server listens. |
| `NODE_ENV` | **Private** | **YES** | `production` | Enforces production runtime safeguards and validation. |
| `CORS_ORIGINS` | **Private** | **YES** | `http://localhost:3000,http://localhost:8081` | Comma-separated list of allowed origins (e.g. `https://example.com,https://admin.example.com`). |
| `UPLOAD_DIR` | **Private** | No | `./uploads` | Directory path for storing uploaded receipts and documents. |
| `DEFAULT_TIMEZONE` | **Private** | No | `Asia/Kolkata` | Canonical timezone for audit logs and report dates. |

### 2.2 Admin Frontend (`admin`)
> **Framework**: Next.js 14. Variables with `NEXT_PUBLIC_` are embedded into client-side JS bundles. `API_URL` is private to the server-side Next.js Node process.

| Variable Name | Visibility | Required in Production | Default / Local Dev Value | Purpose |
|:---|:---:|:---:|:---|:---|
| `NEXT_PUBLIC_API_URL` | **Public** | **YES** | `http://localhost:4000` | Target API domain (e.g. `https://api.example.com`). |
| `NEXT_PUBLIC_SOCKET_URL` | **Public** | No | Defaults to `NEXT_PUBLIC_API_URL` | Direct WebSocket connection origin for real-time tracking & notifications. |
| `API_URL` | **Private** (Server only) | No | Defaults to `NEXT_PUBLIC_API_URL` | Upstream destination used by Next.js `rewrites()` reverse-proxy. |
| `PORT` | **Private** (Server only) | No | `3000` | Local port for Next.js HTTP server. |

### 2.3 User Frontend (`app`)
> **Framework**: React Native with Expo Web. Variables with `EXPO_PUBLIC_` are statically compiled into client web assets and mobile native bundles at build time.

| Variable Name | Visibility | Required in Production | Default / Local Dev Value | Purpose |
|:---|:---:|:---:|:---|:---|
| `EXPO_PUBLIC_API_URL` | **Public** | **YES** | Android: `http://10.0.2.2:4000`<br>Web/iOS: `http://localhost:4000` | Base URL for all REST API and sync requests (e.g. `https://api.example.com`). |
| `EXPO_PUBLIC_DEFAULT_TIMEZONE` | **Public** | No | `Asia/Kolkata` | Local device default timezone for timestamps. |

---

## 3. Local Development Instructions

### 3.1 Initial Setup
```bash
# 1. Install all dependencies from repository root
npm install

# 2. Build the shared TypeScript package
npm run build:shared

# 3. Setup local environment files (copied from examples)
cp api/.env.example api/.env
cp admin/.env.example admin/.env.local
cp app/.env.example app/.env

# 4. Generate Prisma client & apply migrations
npm run db:generate
npm run db:push
npm run db:seed
```

### 3.2 Running Services
You can run all three services concurrently from the root:
```bash
npm run dev
```

Or run each service independently in separate terminals:
- **Backend API**:
  ```bash
  cd api && npm run dev
  # Server running at http://localhost:4000
  ```
- **Admin Dashboard**:
  ```bash
  cd admin && npm run dev
  # Dashboard running at http://localhost:3000
  ```
- **User Frontend (Web SPA)**:
  ```bash
  cd app && npm run web
  # Web application running at http://localhost:8081
  ```
- **User Frontend (Mobile / Expo Go)**:
  ```bash
  cd app && npm run start
  # Scan QR code with Expo Go app
  ```

---

## 4. Production Deployment Settings per Service

The repository is structured as a monorepo where services share `@erp/shared`. The table below outlines the exact deployment parameters for each service across common hosting models:

### 4.1 Deployment Specifications Matrix

| Service | Recommended Provider | Build Context / Root Dir | Install Command | Build Command | Start / Run Command | Output Directory | Health Check Path |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **`api`** | Render / Railway / AWS ECS / Cloud Run / VPS | Root or `api/` | `npm ci` | `npm run build:shared && cd api && npx prisma generate && npm run build` | `cd api && node dist/index.js` | `api/dist` | `/health` (HTTP 200) |
| **`admin`** | Vercel / Render Web / Node VPS | `admin` (or root) | `npm ci` | `cd .. && npm run build:shared && cd admin && npm run build` | `cd admin && npx next start -p 3000` | `admin/.next` | `/` (HTTP 200) |
| **`app`** | Vercel / Netlify / Cloudflare Pages / S3+CloudFront | `app` (or root) | `npm ci` | `cd .. && npm run build:shared && cd app && npm run build` | *Static Web Hosting* | `app/dist` | `/index.html` |

---

## 5. Platform-Specific Deployment Guides

### Option A: Fully Managed (Render Blueprint)
A comprehensive [render.yaml](file:///Users/grahithrao/salesperson_tracking_erp/render.yaml) is included in the project root.
1. Connect your Git repository to [Render](https://render.com).
2. Choose **New > Blueprint** and select `render.yaml`.
3. In the Render Dashboard:
   - Provide a managed PostgreSQL connection string for `DATABASE_URL`.
   - Update `CORS_ORIGINS` on the API service to match your production domains (`https://example.com,https://admin.example.com`).
   - Set `NEXT_PUBLIC_API_URL` on the admin service to `https://api.example.com`.
   - Set `EXPO_PUBLIC_API_URL` on the app service to `https://api.example.com`.
4. Deploy the Blueprint.

### Option B: Vercel (Frontends) + Container (API)
- **Deploying `admin` to Vercel**:
  1. In the Vercel Dashboard, import the repository and select `admin` as the **Root Directory**.
  2. Set Environment Variables:
     - `NEXT_PUBLIC_API_URL` = `https://api.example.com`
     - `NEXT_PUBLIC_SOCKET_URL` = `https://api.example.com`
     - `API_URL` = `https://api.example.com`
  3. Deploy using the included [admin/vercel.json](file:///Users/grahithrao/salesperson_tracking_erp/admin/vercel.json).
  4. Assign custom domain: `admin.example.com`.

- **Deploying `app` to Vercel**:
  1. In the Vercel Dashboard, import the repository and select `app` as the **Root Directory**.
  2. Set Environment Variables:
     - `EXPO_PUBLIC_API_URL` = `https://api.example.com`
     - `EXPO_PUBLIC_DEFAULT_TIMEZONE` = `Asia/Kolkata`
  3. Deploy using the included [app/vercel.json](file:///Users/grahithrao/salesperson_tracking_erp/app/vercel.json).
  4. Assign custom domain: `example.com`.

- **Deploying `api` with Docker**:
  ```bash
  docker build -f api/Dockerfile -t my-org/salesperson-api:latest .
  docker run -d -p 4000:4000 \
    -e DATABASE_URL="postgresql://user:pass@dbhost:5432/dbname?sslmode=require" \
    -e JWT_SECRET="your-ultra-secure-random-32-character-secret-key" \
    -e CORS_ORIGINS="https://example.com,https://admin.example.com" \
    -e NODE_ENV="production" \
    my-org/salesperson-api:latest
  ```

### Option C: Self-Hosted / Single VPS (PM2)
An enterprise [ecosystem.config.js](file:///Users/grahithrao/salesperson_tracking_erp/ecosystem.config.js) is provided.
1. Clone the repository onto the server:
   ```bash
   git clone <repo-url> /opt/salesperson-erp
   cd /opt/salesperson-erp
   npm ci
   npm run build:shared
   ```
2. Populate `/opt/salesperson-erp/api/.env` and `/opt/salesperson-erp/admin/.env.local`.
3. Build the backend and admin:
   ```bash
   cd api && npx prisma migrate deploy && npm run build
   cd ../admin && npm run build
   cd ../app && npm run build
   ```
4. Start processes with PM2:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```
5. Configure Nginx as reverse proxy with SSL (Certbot) to route:
   - `api.example.com` → `http://127.0.0.1:4000` (with WebSocket upgrade headers)
   - `admin.example.com` → `http://127.0.0.1:3000`
   - `example.com` → Serve static files from `/opt/salesperson-erp/app/dist`

---

## 6. Authentication, CORS, and Security Boundaries

### 6.1 Explicit CORS Whitelisting
The API no longer permits wildcard cross-origin access. Requests from browsers evaluate the `Origin` header against `CORS_ORIGINS`:
```typescript
const allowedOrigins = new Set(config.corsOrigins);
// In production, origins not explicitly in CORS_ORIGINS are rejected with 403 Forbidden.
// In non-production, localhost origins are allowed dynamically for rapid local development.
```
> [!IMPORTANT]
> When adding new frontend staging domains or preview URLs, append them to `CORS_ORIGINS` in the API's hosting dashboard.

### 6.2 Authentication Across Domains
- **Authentication Scheme**: Stateless HMAC-SHA256 JWT tokens transmitted via `Authorization: Bearer <token>`.
- **Cross-Domain Safety**: Because tokens are carried via authorization headers or query parameters rather than cross-site cookies, there are no third-party cookie restrictions or `SameSite=None` vulnerabilities across separate subdomains.
- **File & PDF Downloads**: Endpoints like `/api/payments/:id/receipt-pdf` support `?token=<jwt>` so that standard browser `window.open` tabs authenticate securely without cookie leakage.

### 6.3 Server-Side Authorization Boundary
- The frontend separation (`admin.example.com` vs `example.com`) is **strictly a presentation boundary**, NOT a security boundary.
- Every privileged endpoint in the backend enforces server-side role validation (`requireRole(Role.SUPER_ADMIN, Role.ADMIN)`) and granular permission checks (`requireManagerPermission(...)`).
- Even if a non-admin client dispatches requests directly to `/api/settings` or `/api/access-codes`, the backend halts the request with HTTP `403 Forbidden`.

---

## 7. Verification Checklist & Test Results

### 7.1 Automated Checks Completed
- [x] **Shared Package Build**: `npm run build:shared` compiled without error.
- [x] **API Workspace Build**: `npm run build --workspace=@erp/api` compiled TypeScript with zero errors.
- [x] **Admin Workspace Build**: `npm run build --workspace=@erp/admin` compiled 22 static pages with zero errors.
- [x] **App Workspace Web Export**: `npm run build --workspace=@erp/app` bundled static SPA to `app/dist`.
- [x] **Integration Test Suite**: 16/16 tests passed (`test_integration.ts`).
- [x] **Enterprise Upgrades Test Suite**: 18/18 tests passed (`test_upgrades.ts`).
- [x] **Deployment & Security Test Suite**: 16/16 tests passed (`test_deployment_env.ts`):
  - Actionable fatal error when `DATABASE_URL` is omitted.
  - Zero password or secret leaks in error messages.
  - Actionable fatal error when `JWT_SECRET` is weak or default in production.
  - Actionable fatal error when `CORS_ORIGINS` is missing in production.
  - Rejection of disallowed CORS origins with HTTP 403.
  - Unauthenticated access blocks with HTTP 401.
  - Access-code generation and settings mutations blocked for standard users (HTTP 403).

### 7.2 Manual External Setup Required for Launch
The following tasks require access to real production infrastructure and domain registrars:
1. **DNS Provisioning**:
   - Create CNAME for `api.example.com` pointing to the API host / load balancer.
   - Create CNAME for `admin.example.com` pointing to the admin host / Vercel.
   - Create CNAME/A for `example.com` pointing to the web host / CDN.
2. **PostgreSQL Database**:
   - Provision a production managed PostgreSQL 15+ instance (e.g. AWS RDS, Neon, Supabase).
   - Run `DATABASE_URL="..." npx prisma migrate deploy` to create production tables.
3. **Environment Secrets Entry**:
   - Generate a cryptographically random 64-character string for `JWT_SECRET` (`openssl rand -hex 32`).
   - Paste production values into each service's hosting control panel as detailed in Section 2.
